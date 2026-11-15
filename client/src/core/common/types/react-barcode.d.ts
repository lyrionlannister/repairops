declare module "react-barcode" {
  import type { ComponentType } from "react";

  export interface BarcodeProps {
    value: string;
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    background?: string;
    lineColor?: string;
  }

  const Barcode: ComponentType<BarcodeProps>;
  export default Barcode;
}
