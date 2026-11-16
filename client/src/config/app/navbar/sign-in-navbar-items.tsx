import {
  LayoutDashboard,
  MessagesSquare,
  Users,
  Wrench,
  Store,
  Boxes,
  ShoppingCart,
  Megaphone,
  Wallet,
  Truck,
  Building2,
  Users2,
} from "lucide-react";

export const signInNavbarItems = [
  {
    name: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/app/dashboard",
    group: "General",
    new: false,
  },
  {
    name: "Reparaciones",
    icon: <Wrench className="w-5 h-5" />,
    path: "/app/repair-notes",
    group: "Operación",
    new: false,
  },
  {
    name: "Clientes",
    icon: <Users2 className="w-5 h-5" />,
    path: "/app/customers",
    group: "Operación",
    new: false,
  },
  {
    name: "Chats",
    icon: <MessagesSquare className="w-5 h-5" />,
    path: "/app/chats",
    group: "Operación",
    new: false,
  },
  {
    name: "Mi Local",
    icon: <Store className="w-5 h-5" />,
    path: "/app/local",
    group: "Operación",
    new: false,
  },
  {
    name: "Ventas",
    icon: <ShoppingCart className="w-5 h-5" />,
    group: "Ventas y stock",
    new: false,
    subItems: [
      { name: "Venta Rápida", path: "/app/sales/new" },
      { name: "Apartados", path: "/app/layaways" },
      { name: "Devoluciones", path: "/app/returns" },
      { name: "Cotizaciones", path: "/app/quotes" },
    ],
  },
  {
    name: "Inventario",
    icon: <Boxes className="w-5 h-5" />,
    group: "Ventas y stock",
    new: false,
    subItems: [
      { name: "Catálogo", path: "/app/inventory" },
      { name: "Lista de Precios", path: "/app/price-list" },
      { name: "Conteo de inventario", path: "/app/inventory/counts" },
      { name: "Transferencias", path: "/app/inventory/transfers" },
    ],
  },
  {
    name: "Mensajería",
    icon: <Megaphone className="w-5 h-5" />,
    group: "Administración",
    new: false,
    subItems: [
      { name: "Templates", path: "/app/templates" },
      { name: "WhatsApp", path: "/app/whatsapp" },
    ],
  },
  {
    name: "Proveedores",
    icon: <Truck className="w-5 h-5" />,
    path: "/app/suppliers",
    group: "Administración",
    new: false,
  },
  {
    name: "Sucursales",
    icon: <Building2 className="w-5 h-5" />,
    path: "/app/branches",
    group: "Administración",
    new: false,
  },
  {
    name: "Usuarios",
    icon: <Users className="w-5 h-5" />,
    path: "/app/users",
    group: "Administración",
    new: false,
  },
  {
    name: "Caja",
    icon: <Wallet className="w-5 h-5" />,
    path: "/app/cash",
    group: "Administración",
    new: false,
  },
];

export const otherSignInItems = [];

