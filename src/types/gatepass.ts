export interface GatePassItem {
  slNo: number;
  description: string;
  makeItem?: string;
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
  mobileNo?: string;
  id?: string;
  createdBy?: string;
  modifiedBy?: string | null;
  modifiedAt?: Date | string | null;
  isEnable?: boolean;
  returnable?: boolean | number | null;
}

export interface GatePassApiResponse {
  gatepassNo: string;
  date: string;
  items: GatePassItem[];
  destination: string;
  carriedBy: string;
  through: string;
  mobileNo: string;
  id: string;
  createdBy: string;
  createdAt: string;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
  isEnable?: number | boolean;
  returnable?: number | boolean | null;
}

export interface GatePassWithMeta extends GatePassData {
  id: string;
  createdBy: string;
  createdAt: Date | string;
  userName?: string;
  returnable?: boolean | null;
}
