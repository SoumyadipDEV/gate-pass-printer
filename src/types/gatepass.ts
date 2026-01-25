export interface GatePassItem {
  slNo: number;
  description: string;
  model: string;
  serialNo: string;
  qty: number;
}

export interface GatePassData {
  gatepassNo?: string;
  date: Date | string;
  items: GatePassItem[];
  destination: string;
  carriedBy: string;
  through: string;
  id?: string;
  createdBy?: string;
}

export interface GatePassApiResponse {
  gatepassNo: string;
  date: string;
  items: GatePassItem[];
  destination: string;
  carriedBy: string;
  through: string;
  id: string;
  createdBy: string;
  createdAt: string;
}

export interface GatePassWithMeta extends GatePassData {
  id: string;
  createdBy: string;
  createdAt: Date | string;
  userName?: string;
}
