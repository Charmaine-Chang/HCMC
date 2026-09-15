import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { Db } from './db';
import { ActivityDto, AssignDto, CopyDto, FollowupDto, RegisterDto, RespondDto, SearchDto } from './dto';
import { Role } from '@prisma/client';

type Actor = {id:string;role:Role;receptionAccess:boolean;ministryId:string|null};
const envelope = (data:unknown,statusCode=200,meta?:unknown) => ({statusCode,data,...(meta?{meta}:{})});
@Injectable()
export class ApiService {
  constructor(private db:Db) {}
  async login(email:string,password:string) {
    const user=await this.db.user.findUnique({where:{email}});
    if (!user || !(await compare(password,user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    const token=sign({sub:user.id},process.env.JWT_SECRET!,{expiresIn:'8h'});
    return envelope({token,user:{id:user.id,fullName:user.fullName,role:user.role,receptionAccess:user.receptionAccess}});
  }
  async actor(header?:string):Promise<Actor|null> {
    if (!header?.startsWith('Bearer ')) return null;
    try {
      const claims=verify(header.slice(7),process.env.JWT_SECRET!) as {sub:string};
      const user=await this.db.user.findUnique({where:{id:claims.sub}});
      return user?{id:user.id,role:user.role,receptionAccess:user.receptionAccess,ministryId:user.ministryId}:null;
    } catch { return null; }
  }
  require(actor:Actor|null,roles:Role[],reception=false) {
    if (!actor) throw new UnauthorizedException();
    if (!roles.includes(actor.role) || (reception && actor.role==='VOLUNTEER' && !actor.receptionAccess)) throw new ForbiddenException();
    return actor;
  }
  coordinator(actor:Actor|null,ministryId:string) {
    this.require(actor,['ADMIN','PASTOR','VOLUNTEER']);
    if (actor!.role==='VOLUNTEER' && actor!.ministryId!==ministryId) throw new ForbiddenException();
    return actor!;
  }
  async register(dto:RegisterDto) {
    if (!dto.email && !dto.phone) throw new BadRequestException('Email or phone is required');
    const duplicate=await this.db.newcomer.findFirst({where:{OR:[...(dto.email?[{email:dto.email}]:[]),...(dto.phone?[{phone:dto.phone}]:[])]}});
    const item=await this.db.$transaction(async tx=>{
      const n=await tx.newcomer.create({data:{...dto,interestedFellowships:dto.interestedFellowships||[],isPotentialDuplicate:!!duplicate}});
      if(dto.email) await tx.emailTask.create({data:{recipientEmail:dto.email,template:'WELCOME_EMAIL',payload:{preferredName:dto.preferredName||dto.fullName},dedupeKey:`welcome:${n.id}`}});
      return n;
    });
    return envelope({id:item.id,fullName:item.fullName,welcomeMessage:'欢迎来到汉美顿怀恩堂！',hasEmailTaskCreated:!!dto.email,serviceInfo:{time:'请查看最新聚会安排',address:'Hamilton, New Zealand'}},201);
  }
  async newcomers(actor:Actor|null,status?:string,page=1,pageSize=20,search?:string) {
    this.require(actor,['ADMIN','PASTOR','VOLUNTEER'],true);
    const where:any={...(status?{status}:{}),...(search?{OR:[{fullName:{contains:search}},{phone:{contains:search}}]}:{})};
    const [data,total]=await Promise.all([this.db.newcomer.findMany({where,skip:(page-1)*pageSize,take:pageSize,orderBy:{registeredAt:'desc'},include:{assignedVolunteer:{select:{fullName:true}}}}),this.db.newcomer.count({where})]);
    await this.db.auditLog.create({data:{actorId:actor!.id,action:'VIEW_PII',entity:'NEWCOMER',entityId:'list'}});
    return envelope(data,200,{total,page,pageSize});
  }
  async followup(actor:Actor|null,id:string,dto:FollowupDto) {
    this.require(actor,['ADMIN','PASTOR','VOLUNTEER'],true);
    if(dto.assignedVolunteerId && !(await this.db.user.findUnique({where:{id:dto.assignedVolunteerId}}))) throw new BadRequestException('Unknown volunteer');
    const result=await this.db.newcomer.update({where:{id},data:dto});
    await this.db.auditLog.create({data:{actorId:actor!.id,action:'UPDATE_STATUS',entity:'NEWCOMER',entityId:id}});
    return envelope({id:result.id,status:result.status,assignedVolunteerId:result.assignedVolunteerId,updatedAt:result.updatedAt});
  }
  async activities(actor:Actor|null,start?:string,end?:string) {
    const where:any=actor?{}:{visibility:'PUBLIC',status:'PUBLISHED'};
    if(start||end) where.startTime={...(start?{gte:new Date(start)}:{}),...(end?{lte:new Date(end)}:{})};
    const rows=await this.db.activity.findMany({where,include:{ministry:true,duties:{include:{assignments:true}}},orderBy:{startTime:'asc'}});
    return envelope(rows.map(a=>({id:a.id,title:a.title,description:a.description,startTime:a.startTime,endTime:a.endTime,location:a.location,ministry:a.ministry.name,ministryId:a.ministryId,visibility:a.visibility,status:a.status,rosterSummary:{totalDuties:a.duties.reduce((n,d)=>n+d.requiredCount,0),confirmedDuties:a.duties.flatMap(d=>d.assignments).filter(x=>x.status==='ACCEPTED').length,unfilledDuties:a.duties.reduce((n,d)=>n+Math.max(0,d.requiredCount-d.assignments.filter(x=>x.status!=='DECLINED').length),0)}})));
  }
  async createActivity(actor:Actor|null,dto:ActivityDto) {
    this.coordinator(actor,dto.ministryId);
    const start=new Date(dto.startTime),end=new Date(dto.endTime);
    if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||start>=end) throw new BadRequestException('Invalid activity times');
    const a=await this.db.activity.create({data:{...dto,startTime:start,endTime:end,coordinatorId:actor!.id}});
    return envelope({id:a.id,status:a.status},201);
  }
  async updateActivity(actor:Actor|null,id:string,dto:Partial<ActivityDto>) {
    const old=await this.db.activity.findUnique({where:{id},include:{duties:{include:{assignments:{include:{volunteer:true}}}}}});
    if(!old) throw new NotFoundException();
    this.coordinator(actor,old.ministryId);
    const start=new Date(dto.startTime||old.startTime),end=new Date(dto.endTime||old.endTime);
    if(start>=end) throw new BadRequestException('Invalid activity times');
    const a=await this.db.activity.update({where:{id},data:{...dto,startTime:start,endTime:end}});
    if(old.startTime.getTime()!==start.getTime()||old.status!==a.status) {
      for(const assignment of old.duties.flatMap(d=>d.assignments)) await this.db.emailTask.upsert({where:{dedupeKey:`change:${a.id}:${a.updatedAt.toISOString()}:${assignment.id}`},update:{},create:{recipientEmail:assignment.volunteer.email,template:'CHANGE_NOTICE',payload:{activityTitle:a.title,startTime:a.startTime},dedupeKey:`change:${a.id}:${a.updatedAt.toISOString()}:${assignment.id}`}});
    }
    return envelope({id:a.id,status:a.status});
  }
  async addDuty(actor:Actor|null,dto:{activityId:string;name:string;requiredCount:number}) {
    const a=await this.db.activity.findUnique({where:{id:dto.activityId}}); if(!a) throw new NotFoundException(); this.coordinator(actor,a.ministryId);
    return envelope(await this.db.duty.create({data:dto}),201);
  }
  async assign(actor:Actor|null,dto:AssignDto) {
    const duty=await this.db.duty.findUnique({where:{id:dto.dutyId},include:{activity:true,assignments:true}}); if(!duty) throw new NotFoundException();
    this.coordinator(actor,duty.activity.ministryId);
    if(duty.assignments.filter(x=>x.status!=='DECLINED').length>=duty.requiredCount) throw new BadRequestException('Duty is filled');
    const person=await this.db.user.findUnique({where:{id:dto.volunteerId}}); if(!person||!['VOLUNTEER','ADMIN','PASTOR'].includes(person.role)) throw new BadRequestException('Unknown volunteer');
    const conflict=await this.db.volunteerAssignment.findFirst({where:{volunteerId:person.id,status:{not:'DECLINED'},duty:{activity:{startTime:{lt:duty.activity.endTime},endTime:{gt:duty.activity.startTime},status:{not:'CANCELLED'}}}}});
    if(conflict) throw new BadRequestException('Volunteer has overlapping assignment');
    const token=randomBytes(32).toString('hex');
    const row=await this.db.volunteerAssignment.create({data:{dutyId:duty.id,volunteerId:person.id,tokenHash:createHash('sha256').update(token).digest('hex'),tokenExpiresAt:duty.activity.startTime}});
    if(duty.activity.status==='PUBLISHED') await this.db.emailTask.create({data:{recipientEmail:person.email,template:'ROSTER_ASSIGNMENT',payload:{activityTitle:duty.activity.title,dutyName:duty.name,assignmentId:row.id,token},dedupeKey:`assignment:${row.id}`}});
    if(duty.activity.status==='PUBLISHED' && duty.activity.startTime.getTime()>Date.now()+48*3600000) await this.db.emailTask.create({data:{recipientEmail:person.email,template:'REMINDER_48H',payload:{activityTitle:duty.activity.title,dutyName:duty.name,assignmentId:row.id},dedupeKey:`reminder:${row.id}`,scheduledAt:new Date(duty.activity.startTime.getTime()-48*3600000)}});
    await this.db.auditLog.create({data:{actorId:actor!.id,action:'ASSIGN_VOLUNTEER',entity:'ROSTER',entityId:row.id}});
    return envelope({id:row.id,status:row.status},201);
  }
  async roster(actor:Actor|null,activityId:string) {
    this.require(actor,['ADMIN','PASTOR','VOLUNTEER']);
    const activity=await this.db.activity.findUnique({
      where:{id:activityId},
      include:{duties:{include:{assignments:{include:{volunteer:{select:{fullName:true}}}}}}}
    });
    if(!activity) throw new NotFoundException();
    return envelope({activityId,assignments:activity.duties.flatMap(d=>d.assignments.map(a=>({id:a.id,dutyName:d.name,volunteerId:a.volunteerId,volunteerName:a.volunteer.fullName,status:a.status,confirmedAt:a.confirmedAt}))),duties:activity.duties.map(d=>({id:d.id,name:d.name,requiredCount:d.requiredCount}))});
  }
  async respond(actor:Actor|null,id:string,dto:RespondDto) {
    const a=await this.db.volunteerAssignment.findUnique({where:{id},include:{duty:{include:{activity:true}}}}); if(!a) throw new NotFoundException();
    const tokenOk=!!dto.token&&!!a.tokenHash&&createHash('sha256').update(dto.token).digest('hex')===a.tokenHash&&!!a.tokenExpiresAt&&a.tokenExpiresAt>new Date();
    if(!tokenOk && actor?.id!==a.volunteerId) throw new ForbiddenException();
    if(a.status!=='PENDING') throw new BadRequestException('Assignment already answered');
    const updated=await this.db.volunteerAssignment.update({where:{id},data:{status:dto.action==='ACCEPT'?'ACCEPTED':'DECLINED',declineReason:dto.declineReason,confirmedAt:new Date(),tokenHash:null,tokenExpiresAt:null}});
    return envelope({assignmentId:id,status:updated.status,updatedAt:updated.confirmedAt});
  }
  async copy(actor:Actor|null,dto:CopyDto) {
    const [source,target]=await Promise.all([this.db.activity.findUnique({where:{id:dto.sourceActivityId},include:{duties:{include:{assignments:true}}}}),this.db.activity.findUnique({where:{id:dto.targetActivityId}})]);
    if(!source||!target) throw new NotFoundException(); this.coordinator(actor,target.ministryId);
    let assigned=0; const warnings:string[]=[];
    for(const duty of source.duties) {
      const newDuty=await this.db.duty.create({data:{activityId:target.id,name:duty.name,requiredCount:duty.requiredCount}});
      if(dto.copyVolunteers) for(const a of duty.assignments) {
        try { await this.assign(actor,{dutyId:newDuty.id,volunteerId:a.volunteerId}); assigned++; }
        catch { warnings.push(`Could not copy volunteer ${a.volunteerId} for ${duty.name}`); }
      }
    }
    return envelope({copiedDutiesCount:source.duties.length,assignedVolunteersCount:assigned,conflictWarnings:warnings},201);
  }
  async search(dto:SearchDto) {
    const q=dto.query.trim(); if(!q) throw new BadRequestException('Query required');
    const match=q.match(/^(?:John|JHN|约|约翰福音)\s*(\d{1,3})\s*[:：]\s*(\d{1,3})$/i);
    const where:any=match?{bookCode:'JHN',chapter:Number(match[1]),verse:Number(match[2]),version:'CUV'}:{version:'CUV',text:{contains:q}};
    if(dto.testament&&dto.testament!=='ALL') where.testament=dto.testament;
    const [rows,total]=await Promise.all([this.db.scriptureVerse.findMany({where,take:dto.limit||10,skip:dto.offset||0}),this.db.scriptureVerse.count({where})]);
    return envelope({queryType:match?'REFERENCE':'KEYWORD',version:'CUV',total,results:rows.map(v=>({...v,score:match?1:0.5}))});
  }
}
