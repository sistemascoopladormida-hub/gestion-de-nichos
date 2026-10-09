/*
  CEMENTERIO — Cooperativa Eléctrica Ltda. San José de la Dormida
  Creación de base de datos (ajustar rutas de archivos según el servidor).
*/
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'CEMENTERIO')
BEGIN
    CREATE DATABASE [CEMENTERIO];
END
GO

USE [CEMENTERIO];
GO
