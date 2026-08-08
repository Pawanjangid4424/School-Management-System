import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsEmail,
  IsIn,
  IsDateString,
  IsObject,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsOptional() @IsString() addressDetails?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() taluka?: string;
  @IsOptional() @IsString() area?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() pinCode?: string;
  @IsOptional() @IsString() landlineNo?: string;
  @IsOptional() @IsString() areaPostOffice?: string;
  @IsOptional() @IsString() areaPoliceStation?: string;
}

export class GuardianDetailsDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() alternatePhone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() occupation?: string;
  @IsOptional() @IsString() qualification?: string;
  @IsOptional() @IsString() officePhone?: string;
  @IsOptional() @IsString() annualIncome?: string;
  @IsOptional() @IsString() relation?: string;
}

export class CreateStudentDto {
  // Required core fields
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsNumber() @Min(1) @Max(12) classNumber: number;
  @IsString() @IsNotEmpty() section: string;
  @IsNumber() @Min(1) @Max(9999) rollNumber: number;
  @IsNumber() @Min(2000) @Max(2100) admissionYear: number;

  @IsOptional()
  @IsString()
  @IsIn(['SCIENCE', 'COMMERCE', 'ARTS'])
  stream?: string;

  // Extended Personal Details
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() mobileNo?: string;
  @IsOptional() @IsString() alternateMobileNo?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() birthPlace?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() maritalStatus?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() bloodGroup?: string;
  @IsOptional() @IsString() religion?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() subCaste?: string;
  @IsOptional() @IsString() physicallyDisabled?: string;
  @IsOptional() @IsString() aadharNo?: string;
  @IsOptional() @IsString() passportNo?: string;
  @IsOptional() @IsString() visaNumber?: string;
  @IsOptional() @IsString() admissionType?: string;
  @IsOptional() @IsString() admissionThrough?: string;

  // Addresses
  @IsOptional() @IsObject() @Type(() => AddressDto) @ValidateNested() permanentAddress?: AddressDto;
  @IsOptional() @IsObject() @Type(() => AddressDto) @ValidateNested() localAddress?: AddressDto;
  @IsOptional() @IsObject() @Type(() => AddressDto) @ValidateNested() localGuardianAddress?: AddressDto;

  // Guardians
  @IsOptional() @IsObject() @Type(() => GuardianDetailsDto) @ValidateNested() fatherDetails?: GuardianDetailsDto;
  @IsOptional() @IsObject() @Type(() => GuardianDetailsDto) @ValidateNested() motherDetails?: GuardianDetailsDto;
  @IsOptional() @IsObject() @Type(() => GuardianDetailsDto) @ValidateNested() localGuardianDetails?: GuardianDetailsDto;

  // Documents
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() signatureUrl?: string;
}
