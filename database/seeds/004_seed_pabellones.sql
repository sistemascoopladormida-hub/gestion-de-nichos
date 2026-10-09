USE [CEMENTERIO];
GO

SET NOCOUNT ON;

IF NOT EXISTS (SELECT 1 FROM dbo.PABELLONES WHERE CODIGO = N'P1')
BEGIN
    INSERT INTO dbo.PABELLONES (CODIGO, NOMBRE, UBICACION, DESCRIPCION, TOTAL_NICHOS, COLUMNAS_MAPA, FILAS_MAPA, ORDEN_VISUAL)
    VALUES
        (N'P1', N'Pabellón 1', N'Sector Norte, Cementerio Viejo', N'Fila 1: 1-17 | Fila 2: 18-34 | Fila 3: 35-51 | Fila 4: 52-68', 68, 17, 4, 1),
        (N'P2', N'Pabellón 2', N'Sector Sur, Cementerio Viejo', N'Numeración 69-136 (sin renumerar). 17 columnas x 4 filas.', 68, 17, 4, 2),
        (N'P3', N'Pabellón 3', N'Fondo Sector Sur', N'Fila 1: 1-13 | Fila 2: 14-26 | Fila 3: 27-39 | Fila 4: 40-52', 52, 13, 4, 3),
        (N'P4', N'Pabellón 4', N'Fondo Sector Norte', N'Fila 1: 53-65 | Fila 2: 66-78 | Fila 3: 79-91 | Fila 4: 92-104', 52, 13, 4, 4),
        (N'P5', N'Pabellón 5', N'Nuevo', N'Fila 1: 1-13 | Fila 2: 14-26 | Fila 3: 27-39 | Fila 4: 40-52', 52, 13, 4, 5);
END
GO
