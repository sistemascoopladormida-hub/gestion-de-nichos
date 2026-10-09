USE [CEMENTERIO];
GO

SET NOCOUNT ON;

/*
  Contraseñas NO incluidas. Establecer con el script de la aplicación (etapa backend):
  npm run auth:set-password -- --usuario alejandra.valdez
*/
IF NOT EXISTS (SELECT 1 FROM dbo.USUARIOS WHERE USUARIO = N'alejandra.valdez')
BEGIN
    INSERT INTO dbo.USUARIOS (NOMBRE, APELLIDO, USUARIO, ROL, PASSWORD_HASH, PASSWORD_SALT)
    VALUES
        (N'Alejandra', N'Valdez', N'alejandra.valdez', N'ADMINISTRADOR', NULL, NULL),
        (N'Nahuel', N'Ponce', N'nahuel.ponce', N'OPERADOR', NULL, NULL);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.USUARIOS WHERE USUARIO = N'sol.bustos')
BEGIN
    INSERT INTO dbo.USUARIOS (NOMBRE, APELLIDO, USUARIO, ROL, PASSWORD_HASH, PASSWORD_SALT)
    VALUES (N'Sol', N'Bustos', N'sol.bustos', N'OPERADOR', NULL, NULL);
END
GO
