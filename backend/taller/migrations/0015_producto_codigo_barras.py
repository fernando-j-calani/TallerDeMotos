from django.db import migrations

# (nombre_producto, codigo_barras) -- continua la numeracion PROD-### despues
# de los 6 productos originales (PROD-001 a PROD-006).
CODIGOS_BARRA = [
    ('Amortiguador Monoshock Trasero', 'PROD-007'),
    ('Amortiguador Telescópico Delantero (par)', 'PROD-008'),
    ('Juego de Pastillas de Freno', 'PROD-009'),
    ('Zapatas de Freno Trasero', 'PROD-010'),
    ('Cable de Embrague', 'PROD-011'),
    ('Bujía Estándar', 'PROD-012'),
    ('Cadena de Transmisión 428H', 'PROD-013'),
    ('Corona y Piñón (kit)', 'PROD-014'),
    ('Kit de Pistón y Anillos 150cc', 'PROD-015'),
    ('Cigüeñal Completo 125cc', 'PROD-016'),
    ('Kit de Empaquetaduras de Motor', 'PROD-017'),
    ('Aceite de Motor Mineral 20W-50 1L', 'PROD-018'),
    ('Aceite de Motor Sintético 10W-40 1L', 'PROD-019'),
    ('Chicotillo de Acelerador', 'PROD-020'),
    ('Chicotillo de Freno Trasero', 'PROD-021'),
    ('Juego de Válvulas de Admisión y Escape', 'PROD-022'),
    ('Carenado Lateral Original', 'PROD-023'),
    ('Guardabarros Delantero Original', 'PROD-024'),
    ('Tablero Digital Original', 'PROD-025'),
    ('Llanta Delantera Original 80/100-17', 'PROD-026'),
    ('Filtro de Aire Original', 'PROD-027'),
    ('Kit de Mantenimiento 5000km Original', 'PROD-028'),
    ('Kit de Empaquetaduras Original', 'PROD-029'),
    ('Carburador Completo', 'PROD-030'),
    ('Kit Pistón y Anillos', 'PROD-031'),
    ('Kit de Transmisión Económico (cadena+corona+piñón)', 'PROD-032'),
    ('Batería de Gel 12V', 'PROD-033'),
    ('Batería de Ácido 12V', 'PROD-034'),
    ('Espejo Retrovisor (par)', 'PROD-035'),
    ('Cámara de Aire Trasera', 'PROD-036'),
    ('Llanta Económica Trasera 100/90-17', 'PROD-037'),
    ('Foco LED Principal H4', 'PROD-038'),
    ('Barra LED de Asistencia', 'PROD-039'),
    ('Direccionales LED Secuenciales (par)', 'PROD-040'),
    ('Parrilla de Protección de Motor', 'PROD-041'),
    ('Sliders Anti-Caídas (par)', 'PROD-042'),
    ('Casco Certificado Integral', 'PROD-043'),
    ('Guantes de Motociclismo', 'PROD-044'),
    ('Rodilleras de Protección (par)', 'PROD-045'),
    ('Escape Deportivo Slip-On', 'PROD-046'),
    ('Sistema de Inyección Electrónica (kit)', 'PROD-047'),
    ('Carenado de Fibra de Carbono', 'PROD-048'),
    ('Juego de Herramientas Especializadas de Taller', 'PROD-049'),
    ('Módulo de Electrónica de Competición', 'PROD-050'),
    ('Manillar de Competición', 'PROD-051'),
    ('Aceite de Motor Sintético 4T 10W-40 1L', 'PROD-052'),
    ('Aceite de Motor Mineral 2T 1L', 'PROD-053'),
    ('Aditivo Limpiador de Inyectores', 'PROD-054'),
    ('Líquido de Frenos DOT 4 500ml', 'PROD-055'),
    ('Aceite de Horquilla 10W 500ml', 'PROD-056'),
    ('Limpiador de Cadena en Spray', 'PROD-057'),
    ('Grasa Especial para Rodamientos', 'PROD-058'),
    ('Abrillantador y Limpiador de Moto', 'PROD-059'),
    ('Llanta Pirelli Delantera 90/90-19', 'PROD-060'),
    ('Llanta Pirelli Trasera 120/80-19', 'PROD-061'),
    ('Pastillas de Freno Fischer', 'PROD-062'),
    ('Aceite Motorex Premium 4T 1L', 'PROD-063'),
    ('Plástico de Carrocería Acerbis', 'PROD-064'),
    ('Cadena de Transmisión Alta Resistencia', 'PROD-065'),
    ('Compresor Portátil Slime', 'PROD-066'),
    ('Kit de Bujías Múltiples', 'PROD-067'),
    ('Filtro de Aceite', 'PROD-068'),
    ('Filtro de Combustible', 'PROD-069'),
    ('Juego de Rodamientos de Rueda', 'PROD-070'),
    ('Manguera de Freno', 'PROD-071'),
    ('Kit de Reparación de Carburador', 'PROD-072'),
    ('Cable de Comando de Embrague Trilha', 'PROD-073'),
    ('Cable de Comando de Acelerador Trilha', 'PROD-074'),
    ('Kit de Transmisión Endurecido Trilha', 'PROD-075'),
    ('Disco de Embrague Trilha', 'PROD-076'),
    ('Kit de Empaquetaduras de Motor Completo Trilha', 'PROD-077'),
    ('Juego de Componentes de Fricción Trilha', 'PROD-078'),
    ('Cilindro Completo (kit)', 'PROD-079'),
    ('Cigüeñal Reforzado', 'PROD-080'),
    ('Culata Completa', 'PROD-081'),
    ('Silenciador de Escape', 'PROD-082'),
    ('Amortiguador Reforzado Trasero', 'PROD-083'),
    ('Rin de Aleación Delantero', 'PROD-084'),
    ('Juego de Llaves de Encendido', 'PROD-085'),
]


def asignar_codigos_barra(apps, schema_editor):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        for nombre, codigo_barras in CODIGOS_BARRA:
            cursor.execute(
                "UPDATE producto SET codigo_barras = %s WHERE nombre = %s AND id_proveedor IS NOT NULL",
                [codigo_barras, nombre],
            )


def quitar_codigos_barra(apps, schema_editor):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        for nombre, _codigo_barras in CODIGOS_BARRA:
            cursor.execute(
                "UPDATE producto SET codigo_barras = NULL WHERE nombre = %s AND id_proveedor IS NOT NULL",
                [nombre],
            )


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0014_seed_proveedores_productos'),
    ]

    operations = [
        migrations.RunPython(asignar_codigos_barra, quitar_codigos_barra),
    ]
