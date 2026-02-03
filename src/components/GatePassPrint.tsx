import { forwardRef } from "react";
import { GatePassData } from "@/types/gatepass";
import { formatDate } from "@/utils/gatepassNumber";
import surakshaLogo from "@/assets/suraksha-logo.png";
import surakshastamp from "@/assets/suraksha-stamp.png";

interface GatePassPrintProps {
  data: GatePassData;
}

const GatePassContent = ({ data }: { data: GatePassData }) => (
  <div className="border-2 border-foreground p-2 h-full flex flex-col" style={{ fontSize: "0.75rem" }}>
    {/* Header */}
    <div className="grid grid-cols-5 mb-1.5 items-center">
      <div className="h-12 flex items-center justify-center mt-2">
        <img src={surakshaLogo} alt="Suraksha Logo" style={{ height: "150px", objectFit: "contain" }} />
      </div>
      <div className="flex-1 text-center col-span-3">
        <h1 className="text-xs font-bold text-foreground leading-tight">SURAKSHA DIAGNOSTIC LIMITED</h1>
        <p className="text-xs text-muted-foreground leading-tight">
          12/1, Premises No. 02-0327, DG Block(Newtown), Action Area 1D, Kolkata - 700156
        </p>
      </div>
      <div className="h-12 flex items-center justify-center mt-2">
        <img src={surakshastamp} alt="Suraksha Logo" style={{ height: "85px", objectFit: "contain" }} />
      </div>
    </div>

    {/* Gate Pass Title */}
    <div className="text-center mb-1.5">
      <h2 className="text-sm font-bold text-foreground border-b border-foreground inline-block px-3 pb-0.5">
        GATEPASS
      </h2>
    </div>

    {/* Authorization Text */}
    <p className="text-xs mb-1.5 text-foreground leading-tight">
      It is hereby authorized to the bearer to carry the below mentioned items. Please allow him/her to carry the items to our center. All the items are only for stock transfer, It has commercial value.
    </p>

    {/* Gate Pass Details */}
    <div className="flex justify-between mb-1.5 text-xs">
      <p className="font-semibold text-foreground text-sm">GatePass No. {data.gatepassNo}</p>
      <p className="font-semibold text-foreground text-sm">Date: {formatDate(data.date)}</p>
    </div>

    {/* Items Table */}
    <table className="w-full border-collapse border border-foreground mb-0.5 flex-grow" style={{ tableLayout: "fixed" }}>
      <thead>
        <tr className="bg-muted/30 h-6">
          <th className="border border-foreground p-0.5 text-center text-foreground text-xs font-semibold" style={{ width: "5%" }}>Sl No</th>
          <th className="border border-foreground p-0.5 text-center text-foreground text-xs font-semibold" style={{ width: "35%" }}>Description</th>
          <th className="border border-foreground p-0.5 text-center text-foreground text-xs font-semibold" style={{ width: "20%" }}>Model/MT</th>
          <th className="border border-foreground p-0.5 text-center text-foreground text-xs font-semibold" style={{ width: "25%" }}>Serial No</th>
          <th className="border border-foreground p-0.5 text-center text-foreground text-xs font-semibold" style={{ width: "15%" }}>Qty</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item, index) => (
          <tr key={index}>
            <td className="border border-foreground p-0.5 text-foreground text-center" style={{ width: "5%" }}>{item.slNo}</td>
            <td className="border border-foreground p-0.5 text-foreground text-center" style={{ width: "35%" }}>{item.description}</td>
            <td className="border border-foreground p-0.5 text-foreground text-center" style={{ width: "20%" }}>{item.model}</td>
            <td className="border border-foreground p-0.5 text-foreground text-center" style={{ width: "25%" }}>{item.serialNo}</td>
            <td className="border border-foreground p-0.5 text-foreground text-center" style={{ width: "15%" }}>{item.qty}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Destination and Carried By */}
    <div className="my-1 text-xs flex flex-wrap text-center gap-2">
      <p className="text-foreground leading-tight flex-1 min-w-[160px]">
        <span className="font-semibold text-sm">Destination :</span> {data.destination}
      </p>
      <p className="text-foreground leading-tight flex-1 min-w-[160px] text-sm">
        <span className="font-semibold">Carried by:</span> {data.carriedBy}
      </p>
      <p className="text-foreground leading-tight flex-1 min-w-[160px] text-sm">
        <span className="font-semibold">Through:</span> {data.through}
      </p>
      <p className="text-foreground leading-tight flex-1 min-w-[160px] text-sm">
        <span className="font-semibold">Mobile No:</span> {data.mobileNo || "-"}
      </p>
    </div>

    {/* Signature Section */}
    <table className="w-full border-collapse border border-foreground" style={{ tableLayout: "fixed" }}>
      <thead>
        <tr className="h-6 bg-muted/30">
          <th className="border border-foreground p-0.5 text-foreground text-xs font-semibold w-1/3">Dispatched By</th>
          <th className="border border-foreground p-0.5 text-foreground text-xs font-semibold w-1/3">Received By</th>
          <th className="border border-foreground p-0.5 text-foreground text-xs font-semibold w-1/3">Authorized By</th>
        </tr>
      </thead>
      <tbody>
        <tr className="h-8">
          <td className="border border-foreground p-2"></td>
          <td className="border border-foreground p-2"></td>
          <td className="border border-foreground p-2"></td>
        </tr>
      </tbody>
    </table>
  </div>
);

export const GatePassPrint = forwardRef<HTMLDivElement, GatePassPrintProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="print-container bg-card" style={{ width: "210mm", height: "270mm", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* First Copy */}
        <div style={{ flex: 1, borderBottom: "1px dashed #999", overflow: "hidden" }}>
          <GatePassContent data={data} />
        </div>

        {/* Second Copy */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <GatePassContent data={data} />
        </div>
      </div>
    );
  }
);

GatePassPrint.displayName = "GatePassPrint";
