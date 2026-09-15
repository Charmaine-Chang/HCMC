import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
const db=new PrismaClient();
async function main(){
  const password=process.env.DEMO_ADMIN_PASSWORD;
  if(!password||password.length<12) throw new Error('Set DEMO_ADMIN_PASSWORD (12+ characters) to seed the demo admin');
  const ministry=await db.ministry.upsert({where:{name:'Demo Ministry'},update:{},create:{name:'Demo Ministry'}});
  const passwordHash=await hash(password,12);
  const admin=await db.user.upsert({where:{email:'admin@example.com'},update:{passwordHash,role:'ADMIN',receptionAccess:true,ministryId:ministry.id},create:{email:'admin@example.com',fullName:'Demo Admin',passwordHash,role:'ADMIN',receptionAccess:true,ministryId:ministry.id}});
  await db.user.upsert({where:{email:'volunteer@example.com'},update:{passwordHash,role:'VOLUNTEER',ministryId:ministry.id},create:{email:'volunteer@example.com',fullName:'Demo Volunteer',passwordHash,role:'VOLUNTEER',ministryId:ministry.id}});
  const activity=await db.activity.upsert({where:{id:'act_demo_worship'},update:{coordinatorId:admin.id},create:{id:'act_demo_worship',title:'示例主日聚会',description:'用于作品集演示的虚构活动。',startTime:new Date('2026-10-04T21:00:00.000Z'),endTime:new Date('2026-10-04T22:30:00.000Z'),location:'Demo Hall, Hamilton',ministryId:ministry.id,visibility:'PUBLIC',status:'PUBLISHED',coordinatorId:admin.id}});
  await db.duty.upsert({where:{id:'duty_demo_welcome'},update:{activityId:activity.id,name:'接待',requiredCount:2},create:{id:'duty_demo_welcome',activityId:activity.id,name:'接待',requiredCount:2}});
  await db.duty.upsert({where:{id:'duty_demo_audio'},update:{activityId:activity.id,name:'音响',requiredCount:1},create:{id:'duty_demo_audio',activityId:activity.id,name:'音响',requiredCount:1}});
  console.log('Fictional demo users ready. Admin email: admin@example.com');
}
main().finally(()=>db.$disconnect());
