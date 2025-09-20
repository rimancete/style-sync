import { OmitType } from '@nestjs/swagger';
import { CreateBranchDto } from './create-branch.dto';

/**
 * DTO for creating branches in customer context
 * Omits customerId as it comes from the URL context
 */
export class CreateCustomerBranchDto extends OmitType(CreateBranchDto, [
  'customerId',
] as const) {
  // All properties inherited from CreateBranchDto except customerId
  // The customerId will be automatically injected from the customer context
}
