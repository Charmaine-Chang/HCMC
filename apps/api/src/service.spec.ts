import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ApiService } from './service';
import { Db } from './db';

describe('access boundaries',()=>{
  const service=new ApiService({} as Db);
  it('requires login before accessing newcomer records',()=>{
    expect(()=>service.require(null,['ADMIN','PASTOR','VOLUNTEER'],true)).toThrow(UnauthorizedException);
  });
  it('rejects volunteers without reception access',()=>{
    expect(()=>service.require({id:'v',role:'VOLUNTEER',receptionAccess:false,ministryId:'m'},['ADMIN','PASTOR','VOLUNTEER'],true)).toThrow(ForbiddenException);
  });
  it('limits volunteer activity changes to their own ministry',()=>{
    expect(()=>service.coordinator({id:'v',role:'VOLUNTEER',receptionAccess:false,ministryId:'a'},'b')).toThrow(ForbiddenException);
  });
});
