export interface GatePassItem {
  slNo: number;
  description: string;
  model: string;
  serialNo: string;
  qty: number;
}

export interface GatePassData {
  gatepassNo: string;
  date: Date;
  items: GatePassItem[];
  destination: string;
  carriedBy: string;
  through: string;
}
