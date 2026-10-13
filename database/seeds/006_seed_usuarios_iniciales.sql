USE [CEMENTERIO];
GO

SET NOCOUNT ON;

/*
  Contraseñas NO incluidas. Opciones:
  - Autogestión: el usuario visita /activar-cuenta (cuenta sin PASSWORD_HASH)
  - Admin: npm run auth:set-password -- --usuario=...
  - Alta: npm run auth:create-user -- ... --pendiente
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

IF NOT EXISTS (SELECT 1 FROM dbo.USUARIOS WHERE USUARIO = N'solange.cambronero')
BEGIN
    INSERT INTO dbo.USUARIOS (NOMBRE, APELLIDO, USUARIO, ROL, PASSWORD_HASH, PASSWORD_SALT)
    VALUES (N'Solange', N'Cambronero', N'solange.cambronero', N'OPERADOR', NULL, NULL);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.USUARIOS WHERE USUARIO = N'marianela.farias')
BEGIN
    INSERT INTO dbo.USUARIOS (NOMBRE, APELLIDO, USUARIO, ROL, PASSWORD_HASH, PASSWORD_SALT)
    VALUES (N'Marianela', N'Farias', N'marianela.farias', N'OPERADOR', NULL, NULL);
END
GO
