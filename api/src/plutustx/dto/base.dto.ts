export class BasePlutusTxDto {
  name: string;
  jobBidId: string;
  employerId: string;
  jobSeekerId: string;
  assetName: string;
  amount: number;
  lockedTxHash: string;
  unlockedTxHash: string;
  lockDate: Date;
  unlockDate: Date;
  description: string;
}
