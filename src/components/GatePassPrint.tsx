import { forwardRef } from "react";
import { GatePassData } from "@/types/gatepass";
import { formatDate } from "@/utils/gatepassNumber";
import surakshaLogo from "@/assets/suraksha-logo.png";


interface GatePassPrintProps {
  data: GatePassData;
}

const GatePassContent = ({ data }: { data: GatePassData }) => {
  const isReturnable =
    data.returnable === undefined || data.returnable === null
      ? false
      : typeof data.returnable === "number"
        ? data.returnable !== 0
        : typeof data.returnable === "string"
          ? data.returnable !== "0"
          : Boolean(data.returnable);

  return (
    <div className="border-2 border-foreground p-2 h-full flex flex-col" style={{ fontSize: "0.75rem" }}>
      {/* Header */}
      <div className="relative mb-0.5 flex justify-center items-center">
        <div className="text-center px-16" style={{ transform: "translateX(-12px)" }}>
          <h1 className="text-xs font-bold text-foreground leading-tight">SURAKSHA DIAGNOSTIC LIMITED</h1>
          <p className="text-xs text-muted-foreground leading-tight">
            12/1, Premises No. 02-0327, DG Block(Newtown), Action Area 1D, Kolkata - 700156
          </p>
        </div>
        <div className="absolute right-0 mt-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <img src={surakshaLogo} alt="Suraksha Logo" style={{ height: "120px", objectFit: "contain" }} />
        </div>
      </div>

      {/* Gate Pass Title */}
      <div className="text-center mb-1.5 mt-2">
        <h2 className="text-sm font-bold text-foreground border-b border-foreground inline-block px-3 pb-0.5">
          GATEPASS
        </h2>
      </div>

      {/* Authorization Text */}
      <p className="text-xs mb-1.5 text-foreground leading-tight">
        It is hereby authorized to the bearer to carry the below mentioned items. <br/>
        Please allow him/her to carry the items to our center. All the items are only for stock transfer, It has commercial value.
      </p>

      {/* Gate Pass Details */}
      <div className="flex justify-between mb-1.5 text-xs">
        <p className="font-semibold text-foreground text-sm">
          GatePass No. {data.gatepassNo} {isReturnable ? "(Returnable Items)" : ""}
        </p>
        <div className="text-right">
          <p className="font-semibold text-foreground text-sm">
            {data.modifiedAt ? "Date" : "Date"}: {formatDate(data.modifiedAt ?? data.date)}
          </p>
        </div>
      </div>

      <div className="flex flex-col flex-1 gap-1">
        {/* Items Table */}
        <div className="flex-[1.3] min-h-[160px] max-h-[190px]">
          <table className="w-full h-full border-collapse border border-foreground" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="h-6">
                <th className="border border-foreground p-0.5 text-center text-foreground text-xs font-semibold" style={{ width: "5%" }}>Sl No</th>
                <th className="border border-foreground p-0.5 text-center text-foreground text-xs font-semibold" style={{ width: "28%" }}>Description</th>
                <th className="border border-foreground p-0.5 text-center text-foreground text-xs font-semibold" style={{ width: "16%" }}>Make Item</th>              
                <th className="border border-foreground p-0.5 text-center text-foreground text-xs font-semibold" style={{ width: "18%" }}>Model/MT</th>
                <th className="border border-foreground p-0.5 text-center text-foreground text-xs font-semibold" style={{ width: "20%" }}>Serial No</th>
                <th className="border border-foreground p-0.5 text-center text-foreground text-xs font-semibold" style={{ width: "13%" }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-foreground p-0.5 text-foreground text-center" style={{ width: "5%" }}>{item.slNo}</td>
                  <td className="border border-foreground p-0.5 text-foreground text-center" style={{ width: "28%" }}>{item.description}</td>
                  <td className="border border-foreground p-0.5 text-foreground text-center" style={{ width: "16%" }}>{item.makeItem || "-"}</td>                   
                  <td className="border border-foreground p-0.5 text-foreground text-center" style={{ width: "18%" }}>{item.model}</td>
                  <td className="border border-foreground p-0.5 text-foreground text-center" style={{ width: "20%" }}>{item.serialNo}</td>             
                  <td className="border border-foreground p-0.5 text-foreground text-center" style={{ width: "13%" }}>{item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Destination and Carried By */}
        <div className="text-xs flex flex-wrap text-center gap-2 mt-1.5 mb-1.5">
          <p className="text-foreground leading-tight flex-1 min-w-[160px]">
            <span className="font-semibold text-sm">Destination :</span> {data.destination}
          </p>
          <p className="text-foreground leading-tight flex-1 min-w-[160px] text-sm">
            <span className="font-semibold">Carried by:</span> {data.carriedBy}
          </p>
          <p className="text-foreground leading-tight flex-1 min-w-[160px] text-sm">
            <span className="font-semibold">Mobile No:</span> {data.mobileNo || "-"}
          </p>
          <p className="text-foreground leading-tight flex-1 min-w-[160px] text-sm">
            <span className="font-semibold">Through:</span> {data.through}
          </p>
        </div>

        {/* Signature Section */}
        <div className="flex-[0.7] min-h-[60px]">
          <table className="w-full h-full border-collapse border border-foreground" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="h-6">
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
      </div>
    </div>
  );
};

export const GatePassPrint = forwardRef<HTMLDivElement, GatePassPrintProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="print-container bg-card" style={{ width: "210mm", height: "270mm", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* First Copy */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <GatePassContent data={data} />
        </div>

        {/* Separator with scissors */}
        <div className="relative my-3">
          <div className="border-t border-dotted border-muted-foreground"></div>
          <span className="absolute left-1/2 -translate-x-1/2 -top-2 text-xs">✂</span>
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
