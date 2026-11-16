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

const signInNavbarItems = [
  {
    name: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/admin/dashboard",
    group: "General",
    new: false,
  },
  {
    name: "Reparaciones",
    icon: <Wrench className="w-5 h-5" />,
    path: "/admin/repair-notes",
    group: "Operación",
    new: false,
  },
  {
    name: "Clientes",
    icon: <Users2 className="w-5 h-5" />,
    path: "/admin/customers",
    group: "Operación",
    new: false,
  },
  {
    name: "Chats",
    icon: <MessagesSquare className="w-5 h-5" />,
    path: "/admin/chats",
    group: "Operación",
    new: false,
  },
  {
    name: "Mi Local",
    icon: <Store className="w-5 h-5" />,
    path: "/admin/local",
    group: "Operación",
    new: false,
  },
  {
    name: "Ventas",
    icon: <ShoppingCart className="w-5 h-5" />,
    group: "Ventas y stock",
    new: false,
    subItems: [
      { name: "Venta Rápida", path: "/admin/sales/new" },
      { name: "Apartados", path: "/admin/layaways" },
      { name: "Devoluciones", path: "/admin/returns" },
      { name: "Cotizaciones", path: "/admin/quotes" },
    ],
  },
  {
    name: "Inventario",
    icon: <Boxes className="w-5 h-5" />,
    group: "Ventas y stock",
    new: false,
    subItems: [
      { name: "Catálogo", path: "/admin/inventory" },
      { name: "Lista de Precios", path: "/admin/price-list" },
      { name: "Conteo de inventario", path: "/admin/inventory/counts" },
      { name: "Transferencias", path: "/admin/inventory/transfers" },
    ],
  },
  {
    name: "Mensajería",
    icon: <Megaphone className="w-5 h-5" />,
    group: "Administración",
    new: false,
    subItems: [
      { name: "Templates", path: "/admin/templates" },
      { name: "WhatsApp", path: "/admin/whatsapp" },
    ],
  },
  {
    name: "Proveedores",
    icon: <Truck className="w-5 h-5" />,
    path: "/admin/suppliers",
    group: "Administración",
    new: false,
  },
  {
    name: "Sucursales",
    icon: <Building2 className="w-5 h-5" />,
    path: "/admin/branches",
    group: "Administración",
    new: false,
  },
  {
    name: "Usuarios",
    icon: <Users className="w-5 h-5" />,
    path: "/admin/users",
    group: "Administración",
    new: false,
  },
  {
    name: "Caja",
    icon: <Wallet className="w-5 h-5" />,
    path: "/admin/cash",
    group: "Administración",
    new: false,
  },
];

export const otherSignInItems = [];

export default signInNavbarItems;
