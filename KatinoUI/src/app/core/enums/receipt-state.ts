export enum ReceiptState {
  notRequired = 0,
  awaitingPayment = 1,
  pending = 2,
  inProgress = 3,
  waitingForTtn = 4,
  done = 5,
  unknown = 6,
  failed = 7,
  awaitingReturn = 8,
}
