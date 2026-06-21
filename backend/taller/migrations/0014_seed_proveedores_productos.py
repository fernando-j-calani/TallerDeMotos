from django.db import migrations

PROVEEDORES = [
    # (empresa, nit, contacto, telefono, email, direccion)
    ('Kimparts / JunParts SRL', '1011223344', 'Atención al Cliente', '70011223', 'ventas@kimparts.bo', 'Santa Cruz - Bolivia'),
    ('Napor Repuestos', '1011223345', 'Atención al Cliente', '70011224', 'ventas@naporrepuestos.bo', 'Santa Cruz - Bolivia'),
    ('Power Motorcycle', '1011223346', 'Atención al Cliente', '70011225', 'ventas@powermotorcycle.bo', 'Santa Cruz - Bolivia'),
    ('Moto Repuestos Marlyn', '1011223347', 'Atención al Cliente', '70011226', 'ventas@marlyn.bo', 'Santa Cruz - Bolivia'),
    ('Moto Repuestos CotocaLED Racing', '1011223348', 'Atención al Cliente', '70011227', 'ventas@cotocaled.bo', 'Cotoca - Santa Cruz'),
    ('Parts Unlimited (LeMans Corporation)', '1011223349', 'Atención al Cliente', '70011228', 'ventas@partsunlimited.bo', 'Santa Cruz - Bolivia'),
    ('Liqui Moly', '1011223350', 'Atención al Cliente', '70011229', 'ventas@liquimoly.bo', 'Santa Cruz - Bolivia'),
    ('BECAR Import Export SRL', '1011223351', 'Atención al Cliente', '70011230', 'ventas@becar.bo', 'Santa Cruz - Bolivia'),
    ('Moto Parts Trypton', '1011223352', 'Atención al Cliente', '70011231', 'ventas@trypton.bo', 'Santa Cruz - Bolivia'),
    ('Motocruz SRL', '1011223353', 'Atención al Cliente', '70011232', 'ventas@motocruz.bo', 'Santa Cruz - Bolivia'),
    ('Lider 2011 SRL', '1011223354', 'Atención al Cliente', '70011233', 'ventas@lider2011.bo', 'Santa Cruz - Bolivia'),
]

# (empresa_proveedor, nombre, categoria, marca, stock_actual, stock_minimo, precio_compra, precio_venta)
# Precios subidos ~50% sobre la base original (redondeados a múltiplos de 5 Bs).
PRODUCTOS = [
    ('Kimparts / JunParts SRL', 'Amortiguador Monoshock Trasero', 'Suspensión', 'Kimparts', 8, 2, 720.00, 1020.00),
    ('Kimparts / JunParts SRL', 'Amortiguador Telescópico Delantero (par)', 'Suspensión', 'Kimparts', 8, 2, 630.00, 900.00),
    ('Kimparts / JunParts SRL', 'Juego de Pastillas de Freno', 'Frenos', 'Kimparts', 20, 5, 70.00, 110.00),
    ('Kimparts / JunParts SRL', 'Zapatas de Freno Trasero', 'Frenos', 'Kimparts', 20, 5, 50.00, 90.00),
    ('Kimparts / JunParts SRL', 'Cable de Embrague', 'Transmisión', 'Kimparts', 25, 5, 40.00, 70.00),
    ('Kimparts / JunParts SRL', 'Bujía Estándar', 'Eléctrico', 'Kimparts', 30, 8, 20.00, 40.00),
    ('Kimparts / JunParts SRL', 'Cadena de Transmisión 428H', 'Transmisión', 'Kimparts', 15, 3, 135.00, 210.00),
    ('Kimparts / JunParts SRL', 'Corona y Piñón (kit)', 'Transmisión', 'Kimparts', 15, 3, 165.00, 255.00),

    ('Napor Repuestos', 'Kit de Pistón y Anillos 150cc', 'Motor', 'Napor', 12, 3, 225.00, 345.00),
    ('Napor Repuestos', 'Cigüeñal Completo 125cc', 'Motor', 'Napor', 6, 2, 420.00, 630.00),
    ('Napor Repuestos', 'Kit de Empaquetaduras de Motor', 'Motor', 'Napor', 15, 4, 80.00, 135.00),
    ('Napor Repuestos', 'Aceite de Motor Mineral 20W-50 1L', 'Lubricantes', 'Napor', 25, 6, 40.00, 70.00),
    ('Napor Repuestos', 'Aceite de Motor Sintético 10W-40 1L', 'Lubricantes', 'Napor', 25, 6, 80.00, 130.00),
    ('Napor Repuestos', 'Chicotillo de Acelerador', 'Consumibles', 'Napor', 20, 5, 30.00, 50.00),
    ('Napor Repuestos', 'Chicotillo de Freno Trasero', 'Consumibles', 'Napor', 20, 5, 35.00, 55.00),
    ('Napor Repuestos', 'Juego de Válvulas de Admisión y Escape', 'Motor', 'Napor', 10, 3, 105.00, 165.00),

    ('Power Motorcycle', 'Carenado Lateral Original', 'Carrocería', 'Power Motorcycle', 8, 2, 270.00, 405.00),
    ('Power Motorcycle', 'Guardabarros Delantero Original', 'Carrocería', 'Power Motorcycle', 10, 3, 135.00, 210.00),
    ('Power Motorcycle', 'Tablero Digital Original', 'Eléctrico', 'Power Motorcycle', 6, 2, 480.00, 705.00),
    ('Power Motorcycle', 'Llanta Delantera Original 80/100-17', 'Neumáticos', 'Power Motorcycle', 10, 3, 420.00, 615.00),
    ('Power Motorcycle', 'Filtro de Aire Original', 'Consumibles', 'Power Motorcycle', 20, 5, 55.00, 90.00),
    ('Power Motorcycle', 'Kit de Mantenimiento 5000km Original', 'Mantenimiento', 'Power Motorcycle', 12, 3, 225.00, 330.00),
    ('Power Motorcycle', 'Kit de Empaquetaduras Original', 'Motor', 'Power Motorcycle', 12, 3, 100.00, 150.00),

    ('Moto Repuestos Marlyn', 'Carburador Completo', 'Motor', 'Marlyn', 10, 3, 210.00, 315.00),
    ('Moto Repuestos Marlyn', 'Kit Pistón y Anillos', 'Motor', 'Marlyn', 12, 3, 140.00, 225.00),
    ('Moto Repuestos Marlyn', 'Kit de Transmisión Económico (cadena+corona+piñón)', 'Transmisión', 'Marlyn', 15, 4, 195.00, 285.00),
    ('Moto Repuestos Marlyn', 'Batería de Gel 12V', 'Eléctrico', 'Marlyn', 15, 4, 240.00, 360.00),
    ('Moto Repuestos Marlyn', 'Batería de Ácido 12V', 'Eléctrico', 'Marlyn', 15, 4, 165.00, 255.00),
    ('Moto Repuestos Marlyn', 'Espejo Retrovisor (par)', 'Accesorios', 'Marlyn', 25, 6, 45.00, 75.00),
    ('Moto Repuestos Marlyn', 'Cámara de Aire Trasera', 'Neumáticos', 'Marlyn', 25, 6, 40.00, 60.00),
    ('Moto Repuestos Marlyn', 'Llanta Económica Trasera 100/90-17', 'Neumáticos', 'Marlyn', 12, 3, 270.00, 405.00),

    ('Moto Repuestos CotocaLED Racing', 'Foco LED Principal H4', 'Iluminación', 'CotocaLED', 20, 5, 90.00, 140.00),
    ('Moto Repuestos CotocaLED Racing', 'Barra LED de Asistencia', 'Iluminación', 'CotocaLED', 12, 3, 165.00, 255.00),
    ('Moto Repuestos CotocaLED Racing', 'Direccionales LED Secuenciales (par)', 'Iluminación', 'CotocaLED', 15, 4, 105.00, 165.00),
    ('Moto Repuestos CotocaLED Racing', 'Parrilla de Protección de Motor', 'Protección', 'CotocaLED', 10, 3, 210.00, 315.00),
    ('Moto Repuestos CotocaLED Racing', 'Sliders Anti-Caídas (par)', 'Protección', 'CotocaLED', 15, 4, 135.00, 210.00),
    ('Moto Repuestos CotocaLED Racing', 'Casco Certificado Integral', 'Indumentaria', 'CotocaLED', 10, 3, 420.00, 630.00),
    ('Moto Repuestos CotocaLED Racing', 'Guantes de Motociclismo', 'Indumentaria', 'CotocaLED', 20, 5, 90.00, 140.00),
    ('Moto Repuestos CotocaLED Racing', 'Rodilleras de Protección (par)', 'Indumentaria', 'CotocaLED', 15, 4, 110.00, 170.00),

    ('Parts Unlimited (LeMans Corporation)', 'Escape Deportivo Slip-On', 'Performance', 'Parts Unlimited', 5, 2, 975.00, 1425.00),
    ('Parts Unlimited (LeMans Corporation)', 'Sistema de Inyección Electrónica (kit)', 'Performance', 'Parts Unlimited', 3, 1, 1800.00, 2550.00),
    ('Parts Unlimited (LeMans Corporation)', 'Carenado de Fibra de Carbono', 'Carrocería', 'Parts Unlimited', 4, 1, 1275.00, 1875.00),
    ('Parts Unlimited (LeMans Corporation)', 'Juego de Herramientas Especializadas de Taller', 'Herramientas', 'Parts Unlimited', 6, 2, 480.00, 720.00),
    ('Parts Unlimited (LeMans Corporation)', 'Módulo de Electrónica de Competición', 'Electrónica', 'Parts Unlimited', 3, 1, 1470.00, 2175.00),
    ('Parts Unlimited (LeMans Corporation)', 'Manillar de Competición', 'Performance', 'Parts Unlimited', 8, 2, 330.00, 495.00),

    ('Liqui Moly', 'Aceite de Motor Sintético 4T 10W-40 1L', 'Lubricantes', 'Liqui Moly', 30, 8, 100.00, 150.00),
    ('Liqui Moly', 'Aceite de Motor Mineral 2T 1L', 'Lubricantes', 'Liqui Moly', 25, 6, 70.00, 110.00),
    ('Liqui Moly', 'Aditivo Limpiador de Inyectores', 'Aditivos', 'Liqui Moly', 20, 5, 55.00, 90.00),
    ('Liqui Moly', 'Líquido de Frenos DOT 4 500ml', 'Frenos', 'Liqui Moly', 20, 5, 45.00, 70.00),
    ('Liqui Moly', 'Aceite de Horquilla 10W 500ml', 'Suspensión', 'Liqui Moly', 15, 4, 65.00, 100.00),
    ('Liqui Moly', 'Limpiador de Cadena en Spray', 'Mantenimiento', 'Liqui Moly', 20, 5, 50.00, 80.00),
    ('Liqui Moly', 'Grasa Especial para Rodamientos', 'Mantenimiento', 'Liqui Moly', 15, 4, 40.00, 70.00),
    ('Liqui Moly', 'Abrillantador y Limpiador de Moto', 'Limpieza', 'Liqui Moly', 20, 5, 50.00, 75.00),

    ('BECAR Import Export SRL', 'Llanta Pirelli Delantera 90/90-19', 'Neumáticos', 'Pirelli', 8, 2, 570.00, 825.00),
    ('BECAR Import Export SRL', 'Llanta Pirelli Trasera 120/80-19', 'Neumáticos', 'Pirelli', 8, 2, 630.00, 900.00),
    ('BECAR Import Export SRL', 'Pastillas de Freno Fischer', 'Frenos', 'Fischer', 20, 5, 80.00, 130.00),
    ('BECAR Import Export SRL', 'Aceite Motorex Premium 4T 1L', 'Lubricantes', 'Motorex', 20, 5, 110.00, 170.00),
    ('BECAR Import Export SRL', 'Plástico de Carrocería Acerbis', 'Carrocería', 'Acerbis', 8, 2, 300.00, 450.00),
    ('BECAR Import Export SRL', 'Cadena de Transmisión Alta Resistencia', 'Transmisión', 'BECAR', 12, 3, 210.00, 315.00),
    ('BECAR Import Export SRL', 'Compresor Portátil Slime', 'Herramientas', 'Slime', 10, 3, 270.00, 390.00),

    ('Moto Parts Trypton', 'Kit de Bujías Múltiples', 'Eléctrico', 'Trypton', 25, 6, 20.00, 40.00),
    ('Moto Parts Trypton', 'Filtro de Aceite', 'Consumibles', 'Trypton', 25, 6, 25.00, 45.00),
    ('Moto Parts Trypton', 'Filtro de Combustible', 'Consumibles', 'Trypton', 25, 6, 25.00, 40.00),
    ('Moto Parts Trypton', 'Juego de Rodamientos de Rueda', 'Transmisión', 'Trypton', 15, 4, 60.00, 100.00),
    ('Moto Parts Trypton', 'Manguera de Freno', 'Frenos', 'Trypton', 15, 4, 50.00, 80.00),
    ('Moto Parts Trypton', 'Kit de Reparación de Carburador', 'Motor', 'Trypton', 12, 3, 75.00, 120.00),

    ('Motocruz SRL', 'Cable de Comando de Embrague Trilha', 'Transmisión', 'Trilha', 20, 5, 40.00, 70.00),
    ('Motocruz SRL', 'Cable de Comando de Acelerador Trilha', 'Transmisión', 'Trilha', 20, 5, 40.00, 70.00),
    ('Motocruz SRL', 'Kit de Transmisión Endurecido Trilha', 'Transmisión', 'Trilha', 10, 3, 240.00, 360.00),
    ('Motocruz SRL', 'Disco de Embrague Trilha', 'Transmisión', 'Trilha', 12, 3, 140.00, 220.00),
    ('Motocruz SRL', 'Kit de Empaquetaduras de Motor Completo Trilha', 'Motor', 'Trilha', 12, 3, 105.00, 165.00),
    ('Motocruz SRL', 'Juego de Componentes de Fricción Trilha', 'Transmisión', 'Trilha', 12, 3, 90.00, 140.00),

    ('Lider 2011 SRL', 'Cilindro Completo (kit)', 'Motor', 'Lider 2011', 5, 2, 480.00, 705.00),
    ('Lider 2011 SRL', 'Cigüeñal Reforzado', 'Motor', 'Lider 2011', 5, 2, 435.00, 645.00),
    ('Lider 2011 SRL', 'Culata Completa', 'Motor', 'Lider 2011', 4, 1, 525.00, 765.00),
    ('Lider 2011 SRL', 'Silenciador de Escape', 'Escape', 'Lider 2011', 8, 2, 270.00, 405.00),
    ('Lider 2011 SRL', 'Amortiguador Reforzado Trasero', 'Suspensión', 'Lider 2011', 8, 2, 390.00, 570.00),
    ('Lider 2011 SRL', 'Rin de Aleación Delantero', 'Rines', 'Lider 2011', 6, 2, 360.00, 525.00),
    ('Lider 2011 SRL', 'Juego de Llaves de Encendido', 'Accesorios', 'Lider 2011', 15, 4, 70.00, 105.00),
]


def sembrar_proveedores_y_productos(apps, schema_editor):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        for empresa, nit, contacto, telefono, email, direccion in PROVEEDORES:
            cursor.execute(
                "INSERT INTO proveedor (empresa, nit, contacto, telefono, email, direccion) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                [empresa, nit, contacto, telefono, email, direccion],
            )

        for empresa, nombre, categoria, marca, stock_actual, stock_minimo, precio_compra, precio_venta in PRODUCTOS:
            cursor.execute(
                "INSERT INTO producto (nombre, categoria, marca, stock_actual, stock_minimo, "
                "precio_compra, precio_venta, estado, id_proveedor) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, 'Activo', "
                "(SELECT codigo FROM proveedor WHERE empresa = %s))",
                [nombre, categoria, marca, stock_actual, stock_minimo, precio_compra, precio_venta, empresa],
            )


def eliminar_proveedores_y_productos(apps, schema_editor):
    connection = schema_editor.connection
    empresas = [empresa for empresa, *_ in PROVEEDORES]
    with connection.cursor() as cursor:
        cursor.execute(
            "DELETE FROM producto WHERE id_proveedor IN "
            "(SELECT codigo FROM proveedor WHERE empresa = ANY(%s))",
            [empresas],
        )
        cursor.execute("DELETE FROM proveedor WHERE empresa = ANY(%s)", [empresas])


class Migration(migrations.Migration):

    dependencies = [
        ('taller', '0013_compra_comprobante_pago'),
    ]

    operations = [
        migrations.RunPython(sembrar_proveedores_y_productos, eliminar_proveedores_y_productos),
    ]
