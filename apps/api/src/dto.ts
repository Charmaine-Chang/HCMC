import { IsArray, IsBoolean, IsEmail, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class LoginDto { @IsEmail() email!:string; @IsString() password!:string; }
export class RegisterDto {
  @IsString() @MinLength(1) fullName!:string;
  @IsOptional() @IsString() preferredName?:string;
  @IsOptional() @IsEmail() email?:string;
  @IsOptional() @IsString() phone?:string;
  @IsIn(['CHINESE','ENGLISH','BILINGUAL']) preferredLanguage!: 'CHINESE'|'ENGLISH'|'BILINGUAL';
  @IsOptional() @IsArray() @IsString({each:true}) interestedFellowships?:string[];
  @IsBoolean() consentContact!:boolean;
  @IsOptional() @IsBoolean() subscribeUpdates?:boolean;
}
export class FollowupDto {
  @IsOptional() @IsIn(['PENDING_FOLLOWUP','CONTACTED','COMPLETED']) status?:'PENDING_FOLLOWUP'|'CONTACTED'|'COMPLETED';
  @IsOptional() @IsString() assignedVolunteerId?:string;
  @IsOptional() @IsString() notes?:string;
}
export class ActivityDto {
  @IsString() @MinLength(1) title!:string;
  @IsOptional() @IsString() description?:string;
  @IsString() startTime!:string;
  @IsString() endTime!:string;
  @IsString() location!:string;
  @IsString() ministryId!:string;
  @IsIn(['PUBLIC','INTERNAL']) visibility!:'PUBLIC'|'INTERNAL';
  @IsIn(['DRAFT','PUBLISHED']) status!:'DRAFT'|'PUBLISHED';
}
export class DutyDto { @IsString() activityId!:string; @IsString() name!:string; @IsInt() @Min(1) @Max(20) requiredCount!:number; }
export class AssignDto { @IsString() dutyId!:string; @IsString() volunteerId!:string; }
export class RespondDto { @IsIn(['ACCEPT','DECLINE']) action!:'ACCEPT'|'DECLINE'; @IsOptional() @IsString() token?:string; @IsOptional() @IsString() declineReason?:string; }
export class CopyDto { @IsString() sourceActivityId!:string; @IsString() targetActivityId!:string; @IsBoolean() copyVolunteers!:boolean; }
export class SearchDto { @IsString() query!:string; @IsOptional() @IsIn(['CUV']) version?:'CUV'; @IsOptional() @IsIn(['ALL','OT','NT']) testament?:'ALL'|'OT'|'NT'; @IsOptional() @Type(()=>Number) @IsInt() @Min(1) @Max(50) limit?:number; @IsOptional() @Type(()=>Number) @IsInt() @Min(0) offset?:number; }
