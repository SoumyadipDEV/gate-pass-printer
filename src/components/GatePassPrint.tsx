import { forwardRef } from "react";
import { GatePassData } from "@/types/gatepass";
import { formatDate } from "@/utils/gatepassNumber";
import surakshaLogo from "@/assets/suraksha-logo.jpg";

interface GatePassPrintProps {
  data: GatePassData;
}

export const GatePassPrint = forwardRef<HTMLDivElement, GatePassPrintProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="print-container bg-card p-8" style={{ width: "210mm", minHeight: "297mm" }}>
        {/* First Copy */}
        <div className="border-2 border-foreground p-6 mb-8">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex justify-center mb-2">
              <img src={surakshaLogo} alt="Suraksha Logo" className="h-16 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-foreground">SURAKSHA DIAGNOSTIC LIMITED</h1>
            <p className="text-sm text-muted-foreground">
              12/1, Premises No. 02-0327, DG Block(Newtown), Action Area 1D, Kolkata - 700156
            </p>
          </div>

          {/* Gate Pass Title */}
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-foreground border-b-2 border-foreground inline-block px-8 pb-1">
              GATEPASS
            </h2>
          </div>

          {/* Authorization Text */}
          <p className="text-sm mb-4 text-foreground">
            It is hereby authorized to the bearer to carry the below mentioned items. Please allow him/her to carry the items to our center. All the items are only for stock transfer, It has commercial value.
          </p>

          {/* Gate Pass Details */}
          <div className="flex justify-between mb-4">
            <p className="font-semibold text-foreground">GatePass No. {data.gatepassNo}</p>
            <p className="font-semibold text-foreground">Date: {formatDate(data.date)}</p>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse border border-foreground mb-4">
            <thead>
              <tr className="bg-muted/30">
                <th className="border border-foreground p-2 text-left text-foreground">SI No</th>
                <th className="border border-foreground p-2 text-left text-foreground">Description</th>
                <th className="border border-foreground p-2 text-left text-foreground">Model/MT</th>
                <th className="border border-foreground p-2 text-left text-foreground">SRL No</th>
                <th className="border border-foreground p-2 text-left text-foreground">QTY</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-foreground p-2 text-foreground">{item.slNo}</td>
                  <td className="border border-foreground p-2 text-foreground">{item.description}</td>
                  <td className="border border-foreground p-2 text-foreground">{item.model}</td>
                  <td className="border border-foreground p-2 text-foreground">{item.serialNo}</td>
                  <td className="border border-foreground p-2 text-foreground">{item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Destination and Carried By */}
          <div className="mb-4 space-y-2">
            <p className="text-foreground"><span className="font-semibold">Destination :</span> {data.destination}</p>
            <p className="text-foreground"><span className="font-semibold">Carried by:</span> {data.carriedBy}</p>
            <p className="text-foreground"><span className="font-semibold">Through:</span> {data.through}</p>
          </div>

          {/* Signature Section */}
          <table className="w-full border-collapse border border-foreground">
            <thead>
              <tr>
                <th className="border border-foreground p-2 text-foreground w-1/3">Dispatched By</th>
                <th className="border border-foreground p-2 text-foreground w-1/3">Received By</th>
                <th className="border border-foreground p-2 text-foreground w-1/3">Authorized By</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-foreground p-8"></td>
                <td className="border border-foreground p-8"></td>
                <td className="border border-foreground p-8"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dotted Line Separator */}
        <div className="border-t-2 border-dashed border-muted my-4"></div>

        {/* Second Copy (Duplicate) */}
        <div className="border-2 border-foreground p-6">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex justify-center mb-2">
              <img src={surakshaLogo} alt="Suraksha Logo" className="h-16 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-foreground">SURAKSHA DIAGNOSTIC LIMITED</h1>
            <p className="text-sm text-muted-foreground">
              12/1, Premises No. 02-0327, DG Block(Newtown), Action Area 1D, Kolkata - 700156
            </p>
          </div>

          {/* Gate Pass Title */}
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-foreground border-b-2 border-foreground inline-block px-8 pb-1">
              GATEPASS
            </h2>
          </div>

          {/* Authorization Text */}
          <p className="text-sm mb-4 text-foreground">
            It is hereby authorized to the bearer to carry the below mentioned items. Please allow him/her to carry the items to our center. All the items are only for stock transfer, It has commercial value.
          </p>

          {/* Gate Pass Details */}
          <div className="flex justify-between mb-4">
            <p className="font-semibold text-foreground">GatePass No. {data.gatepassNo}</p>
            <p className="font-semibold text-foreground">Date: {formatDate(data.date)}</p>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse border border-foreground mb-4">
            <thead>
              <tr className="bg-muted/30">
                <th className="border border-foreground p-2 text-left text-foreground">SI No</th>
                <th className="border border-foreground p-2 text-left text-foreground">Description</th>
                <th className="border border-foreground p-2 text-left text-foreground">Model/MT</th>
                <th className="border border-foreground p-2 text-left text-foreground">SRL No</th>
                <th className="border border-foreground p-2 text-left text-foreground">QTY</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-foreground p-2 text-foreground">{item.slNo}</td>
                  <td className="border border-foreground p-2 text-foreground">{item.description}</td>
                  <td className="border border-foreground p-2 text-foreground">{item.model}</td>
                  <td className="border border-foreground p-2 text-foreground">{item.serialNo}</td>
                  <td className="border border-foreground p-2 text-foreground">{item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Destination and Carried By */}
          <div className="mb-4 space-y-2">
            <p className="text-foreground"><span className="font-semibold">Destination :</span> {data.destination}</p>
            <p className="text-foreground"><span className="font-semibold">Carried by:</span> {data.carriedBy}</p>
            <p className="text-foreground"><span className="font-semibold">Through:</span> {data.through}</p>
          </div>

          {/* Signature Section */}
          <table className="w-full border-collapse border border-foreground">
            <thead>
              <tr>
                <th className="border border-foreground p-2 text-foreground w-1/3">Dispatched By</th>
                <th className="border border-foreground p-2 text-foreground w-1/3">Received By</th>
                <th className="border border-foreground p-2 text-foreground w-1/3">Authorized By</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-foreground p-8"></td>
                <td className="border border-foreground p-8"></td>
                <td className="border border-foreground p-8"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

GatePassPrint.displayName = "GatePassPrint";
