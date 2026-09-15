import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Req, Res, BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Db } from './db';
import { ApiService } from './service';
import { ActivityDto, AssignDto, CopyDto, DutyDto, FollowupDto, LoginDto, RegisterDto, RespondDto, SearchDto } from './dto';

const hits=new Map<string,number[]>();
function limit(key:string,max:number) { const now=Date.now(),recent=(hits.get(key)||[]).filter(t=>t>now-60000); if(recent.length>=max) throw new ForbiddenException('Rate limit exceeded'); recent.push(now); hits.set(key,recent); }
@Controller('api/v1')
export class ApiController {
  constructor(private api:ApiService,private db:Db) {}
  @Get('health') health(){return {statusCode:200,data:{status:'ok'}};}
  @Post('auth/login') login(@Body() dto:LoginDto){return this.api.login(dto.email,dto.password);}
  @Post('newcomers/register') register(@Req() req:Request,@Body() dto:RegisterDto){limit(`register:${req.ip}`,5);return this.api.register(dto);}
  @Get('newcomers') async newcomers(@Headers('authorization') auth:string,@Query('status') status?:string,@Query('page') page?:string,@Query('pageSize') pageSize?:string,@Query('search') search?:string){return this.api.newcomers(await this.api.actor(auth),status,Math.max(1,Number(page)||1),Math.min(100,Math.max(1,Number(pageSize)||20)),search);}
  @Patch('newcomers/:id/followup') async followup(@Headers('authorization') auth:string,@Param('id') id:string,@Body() dto:FollowupDto){return this.api.followup(await this.api.actor(auth),id,dto);}
  @Get('activities') async activities(@Headers('authorization') auth:string,@Query('start') start?:string,@Query('end') end?:string){return this.api.activities(await this.api.actor(auth),start,end);}
  @Post('activities') async createActivity(@Headers('authorization') auth:string,@Body() dto:ActivityDto){return this.api.createActivity(await this.api.actor(auth),dto);}
  @Patch('activities/:id') async updateActivity(@Headers('authorization') auth:string,@Param('id') id:string,@Body() dto:Partial<ActivityDto>){return this.api.updateActivity(await this.api.actor(auth),id,dto);}
  @Post('rosters/duties') async duty(@Headers('authorization') auth:string,@Body() dto:DutyDto){return this.api.addDuty(await this.api.actor(auth),dto);}
  @Post('rosters/assignments') async assign(@Headers('authorization') auth:string,@Body() dto:AssignDto){return this.api.assign(await this.api.actor(auth),dto);}
  @Get('rosters/activity/:id') async roster(@Headers('authorization') auth:string,@Param('id') id:string){return this.api.roster(await this.api.actor(auth),id);}
  @Get('rosters/mine') async mine(@Headers('authorization') auth:string){const actor=this.api.require(await this.api.actor(auth),['ADMIN','PASTOR','VOLUNTEER']);const rows=await this.db.volunteerAssignment.findMany({where:{volunteerId:actor.id,duty:{activity:{endTime:{gte:new Date()}}}},include:{duty:{include:{activity:true}}},orderBy:{createdAt:'desc'}});return {statusCode:200,data:rows.map(a=>({id:a.id,dutyName:a.duty.name,activityTitle:a.duty.activity.title,startTime:a.duty.activity.startTime,status:a.status}))};}
  @Post('rosters/assignments/:id/respond') async respond(@Headers('authorization') auth:string,@Param('id') id:string,@Body() dto:RespondDto){return this.api.respond(await this.api.actor(auth),id,dto);}
  @Post('rosters/copy') async copy(@Headers('authorization') auth:string,@Body() dto:CopyDto){return this.api.copy(await this.api.actor(auth),dto);}
  @Get('users/volunteers') async volunteers(@Headers('authorization') auth:string){this.api.require(await this.api.actor(auth),['ADMIN','PASTOR','VOLUNTEER']);return {statusCode:200,data:await this.db.user.findMany({where:{role:{in:['ADMIN','PASTOR','VOLUNTEER']}},select:{id:true,fullName:true}})};}
  @Get('ministries') async ministries(){return {statusCode:200,data:await this.db.ministry.findMany({select:{id:true,name:true}})};}
  @Post('scripture/search') search(@Req() req:Request,@Body() dto:SearchDto){limit(`search:${req.ip}`,30);return this.api.search(dto);}
  @Get('scripture/passage') async passage(@Query('book') book:string,@Query('chapter') chapter:string){const code=/^(JHN|JOHN|约|约翰福音)$/i.test(book||'')?'JHN':book;const verses=await this.db.scriptureVerse.findMany({where:{bookCode:code,chapter:Number(chapter),version:'CUV'},orderBy:{verse:'asc'}});return {statusCode:200,data:{bookCode:code,bookName:verses[0]?.bookName||code,chapter:Number(chapter),version:'CUV',verses:verses.map(v=>({verse:v.verse,text:v.text}))}};}
  @Get('scripture/topics') topics(){return {statusCode:200,data:[{title:'爱与饶恕',query:'饶恕'},{title:'平安与盼望',query:'平安'},{title:'认识信仰',query:'约翰福音 3:16'}]};}
  @Post('scripture/ask') ask(@Res() res:Response){res.status(503).json({statusCode:503,error:'RAG_UNAVAILABLE',message:'完整经文语料和向量检索尚未配置；目前可使用准确章节查找与关键词搜索。'});}
  @Post('tasks/process-emails') async emails(@Headers('x-cron-secret') secret:string){
    if(!process.env.CRON_SECRET||secret!==process.env.CRON_SECRET) throw new ForbiddenException();
    if(!process.env.RESEND_API_KEY) throw new ServiceUnavailableException('RESEND_API_KEY is not configured');
    const tasks=await this.db.emailTask.findMany({where:{status:{in:['PENDING','FAILED']},scheduledAt:{lte:new Date()},retryCount:{lt:4}},take:20,orderBy:{scheduledAt:'asc'}});
    let sent=0,failed=0;
    for(const t of tasks){
      const payload=t.payload as Record<string,string>;
      const subject=t.template==='WELCOME_EMAIL'?'欢迎来到 HCMC':t.template==='ROSTER_ASSIGNMENT'?'志愿者服事安排':t.template==='REMINDER_48H'?'服事提醒':'活动安排更新';
      const message=t.template==='WELCOME_EMAIL'?`你好 ${payload.preferredName||''}，欢迎来到 HCMC。请查看教会网站了解最新聚会安排。`:t.template==='ROSTER_ASSIGNMENT'?`活动：${payload.activityTitle}；岗位：${payload.dutyName}。请登录志愿者页面确认。`:t.template==='REMINDER_48H'?`提醒：活动 ${payload.activityTitle} 将于约 48 小时后开始，岗位：${payload.dutyName}。`:`活动 ${payload.activityTitle} 的安排已有更新，请查看日历。`;
      try {const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM,to:t.recipientEmail,subject,text:message})});if(!response.ok)throw new Error(`Email provider returned ${response.status}`);await this.db.emailTask.update({where:{id:t.id},data:{status:'SENT',sentAt:new Date(),lastError:null}});sent++;}
      catch(error){const retry=t.retryCount+1;await this.db.emailTask.update({where:{id:t.id},data:{status:'FAILED',retryCount:retry,lastError:String(error),scheduledAt:new Date(Date.now()+Math.min(3600000,60000*2**retry))}});failed++;}
    }
    return {statusCode:200,data:{processed:tasks.length,sent,failed}};
  }
}
