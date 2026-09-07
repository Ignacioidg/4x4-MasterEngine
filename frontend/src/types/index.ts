export interface User {
  Id?: number;
  Username: string;
  Role: 'Administrador' | 'Usuario' | string;
  Token?: string;
}

export interface Accesorio {
  Id: number;
  Nombre: string;
  Descripcion: string;
  Precio: number;
  Categoria: string;
}

export interface ComponenteDesgaste {
  Id: number;
  Nombre: string;
  VidaUtilKmEquivalentes: number;
  DesgasteAcumulado: number;
  KilometrosSeverosAcumulados: number;
}

export interface Trayecto {
  Id: number;
  Kilometros: number;
  TipoSuelo: number;
  Fecha: string;
}

export interface VehiculoBuild {
  Id: number;
  Nombre: string;
  VehiculoId?: number;
  Vehiculo?: string;
  CantidadAccesorios?: number;
  Accesorios?: Accesorio[];
}

export interface MercadoLibreItem {
  Id: string;
  Title: string;
  Price: number;
  CurrencyId: string;
  Thumbnail: string;
  Permalink: string;
  Condition: string;
  FreeShipping: boolean;
  SellerNickname?: string;
}

export interface MercadoLibreSearchResult {
  Query: string;
  Total: number;
  Results: MercadoLibreItem[];
  ErrorMessage?: string;
}

export interface Vehiculo {
  Id: number;
  Marca: string;
  Modelo: string;
  Anio: number;
  Patente: string;
  TrimId?: string;
  KilometrajeInicial: number;
  KilometrajeActual: number;
  AccesoriosEquipados?: Accesorio[];
  ComponentesDesgaste?: ComponenteDesgaste[];
  Trayectos?: Trayecto[];
  Builds?: VehiculoBuild[];
}

export interface BudgetResponse {
  VehiculoId: number;
  Vehiculo: string;
  CostoTotalAccesorios: number;
}

export interface AuditLog {
  Id: number;
  EntityName: string;
  Action: string;
  Username: string;
  Timestamp: string;
  PrimaryKey: string;
  OldValues?: string;
  NewValues?: string;
}

export interface VehicleMake {
  MakeId: number;
  MakeName: string;
}

export interface VehicleModel {
  ModelId: number;
  ModelName: string;
  MakeName: string;
}

export interface VinDecodeResult {
  Vin: string;
  Year?: number;
  Make: string;
  Model: string;
  DriveType: string;
  VehicleType: string;
  Trim: string;
}

