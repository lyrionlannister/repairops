import "reflect-metadata";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";
import { QuoteItemInputDto } from "./quote-item-input.dto.js";

export class UpdateQuoteDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ValidateIf((o: UpdateQuoteDto) => o.brand !== undefined || o.model !== undefined || o.reportedFailure !== undefined)
  @IsString()
  brand?: string;

  @ValidateIf((o: UpdateQuoteDto) => o.brand !== undefined || o.model !== undefined || o.reportedFailure !== undefined)
  @IsString()
  model?: string;

  @ValidateIf((o: UpdateQuoteDto) => o.brand !== undefined || o.model !== undefined || o.reportedFailure !== undefined)
  @IsString()
  reportedFailure?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceTypeIds?: string[];

  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  createdByEmployeeId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: "La cotización debe tener al menos un item" })
  @ValidateNested({ each: true })
  @Type(() => QuoteItemInputDto)
  items?: QuoteItemInputDto[];
}
