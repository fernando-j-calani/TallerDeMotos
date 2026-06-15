COPY public.rol (codigo, nombre, descripcion) FROM stdin;
3	Mecánico	Encargado de la reparación y diagnóstico
4	Cliente	Acceso al portal web para seguimiento de su motocicleta
1	Administrador	edit smoke
2	Recepcionista	edit test
\.

COPY public.privilegio (codigo, nombre, descripcion) FROM stdin;
2	Gestionar Roles y Privilegios	Asignar roles y permisos a usuarios
3	Gestionar Clientes	Registrar y modificar datos de clientes (CU05)
4	Gestionar Motocicletas	Registrar y modificar datos de motos (CU06)
5	Crear Orden de Trabajo	Iniciar una nueva orden de servicio
6	Actualizar Estado de Orden	Cambiar estado, agregar repuestos y notas (Mecánico)
7	Generar Factura	Realizar cobros y emitir notas de servicio
8	Consultar Bitácora	Ver el registro de auditoría del sistema (CU20)
1	Gestionar Usuarios	edit test
\.

COPY public.rol_privilegio (id_rol, id_privilegio) FROM stdin;
1	1
1	2
1	3
1	4
1	5
1	6
1	7
1	8
2	3
2	4
2	5
2	7
3	6
\.

COPY public.usuario (codigo, id_rol, nombre, email, contrasena, telefono, estado, fecha_registro) FROM stdin;
4	3	Clark Kent (Mecánico)	clark@laroca.com	pbkdf2_sha256$600000$5j1RIsR4vkpMU8sig82IBr$cujDG8dPxqqKkV9CMC7iUsuz8/dmWFmynwtXdVcTmcE=	76938475	Activo	\N
5	4	Homero	homero@laroca.com	pbkdf2_sha256$600000$NklhtSZsTOa70Dc2TLCNrm$R6iiscAvIuGNqRc2gjGRvBlbPsQM5Ew+biPptF2tIJ4=	75934859	Activo	\N
7	3	Usuario Auditoria	auditoria_8908e5df@test.com	pbkdf2_sha256$600000$0vBgIsBKHyrl1CCQy7eLMN$MCPGqIHjRIbukXjEBQGJJ5nPo8AAJz9LLD8vdFazFNk=	70000000	Activo	\N
8	4	Lisa	lisa@laroca.com	pbkdf2_sha256$600000$FXUkCQRP7GqCOjtuGKQgK3$IeVJPd+p9JmnKlCPqnkgpHTs0FyFIZekzCqFy0irP9c=	99999999	Activo	\N
2	2	Maria (Recepcionista)	maria@laroca.com	pbkdf2_sha256$600000$lxU6ozQMd3oA316oiwlbZh$J3E4CAcXQjh2/V9SePqf22AnQH1LNoENCGysfl9TMvE=	66666666	Activo	2026-04-13
1	1	Admin Principal	admin@laroca.com	pbkdf2_sha256$600000$AQ4vmBV6kApcXmKxN3ga1O$1Gy0XfnhNflB5y9fLC7y9e2d4EaBfuQOCRPmeZJljlc=	77777777	Activo	2026-04-13
13	2	Tmp C1	tmp.c1.424690@laroca.com	pbkdf2_sha256$600000$FIponWMmVa8I40D4ezVneG$nwlKoxC5rTrzE3FXaHamFj0HvYfw3YfhWCXWa78hxwA=	70010000	Inactivo	\N
9	2	Recep Smoke Edit 20260413152012	recep.smoke.20260413152012@laroca.com	pbkdf2_sha256$600000$SoYk1K2NAsTCCIqmT2HSTf$Y1P0cSUk6Ss9KOWumtblz682jTauobHZa2g9Q04T60g=	79900000	Inactivo	\N
14	4	Maria Lopez	marialopez@laroca.com	pbkdf2_sha256$600000$59z5xgcCFfVGI64BIlkHG9$M4G4gaF4TtZfWx+I5v/4megRnnoumKbPKePHfJhf1ms=	76655443	Activo	\N
12	4	Ana Perez	anaperez	pbkdf2_sha256$600000$QnHF0xhfo4LKb44MvsOPx0$mCeEMLFj6OwROYqwRh3/QSYyoJERhqihKGch8sMbRPI=	70011122	Inactivo	\N
3	3	Carlos (Mecánico)	carlos@laroca.com	pbkdf2_sha256$600000$kco3HuUj5fKBm5bSSyNARa$xLhJhfWfXfQi3+Gr8k+UT3SE6hRNOhZwKorkwSTlX98=	55555555	Activo	2026-04-13
15	4	Ana Roca	anaroca@laroca.com	pbkdf2_sha256$600000$oXcP2ChlzLaSNAkkbB9KuQ$xHx0kBXkZl/wI67MNBAw6DmvX1jJqTdWl2uwPp5CDfc=	74433221	Activo	\N
\.

COPY public.cliente (codigo, cedula, nombre, telefono, telefono_alternativo, direccion, email, fecha_registro, estado) FROM stdin;
1	8899776	Maria Lopez	76655443	\N	Av. Banzer 4to Anillo	maria@gmail.com	2026-04-13	Activo
2	5544332	Roberto Gomez	75544332	\N	Plan 3000	roberto@hotmail.com	2026-04-13	Activo
3	1122334	Ana Roca	74433221	\N	Villa 1ro de Mayo	ana.roca@yahoo.com	2026-04-13	Activo
4	3322110	Luis Prueba	70011222	\N	Av. Santos Dumont	luis@prueba.com	2026-04-13	Activo
9	6666668	Alex Arg	73189033				\N	Inactivo
\.

COPY public.motocicleta (codigo, id_cliente, placa, marca, modelo, anio, cilindraje, color, numero_motor, numero_chasis, kilometraje_actual, estado) FROM stdin;
1	1	1234-ABC	Honda	Navi	2022	110cc	Rojo	\N	\N	5400.50	Activo
2	2	5678-DEF	Yamaha	FZ-S	2020	150cc	Negro	\N	\N	15200.00	Activo
3	2	9012-GHI	Suzuki	Gixxer	2023	155cc	Azul	\N	\N	2100.00	Activo
4	3	3456-JKL	KTM	Duke 200	2021	200cc	Naranja	\N	\N	18500.00	Activo
\.

COPY public.proveedor (codigo, empresa, nit, contacto, telefono, email, direccion) FROM stdin;
1	Importadora Repuestos S.A.	10203040	Ing. Mario Vaca	33445566	ventas@repuestossa.com	Av. Cristo Redentor 3er Anillo
2	Motopartes Express	55667788	Lic. Julia Ortiz	33112233	contacto@motopartes.bo	Zona Parque Industrial
\.

COPY public.producto (codigo, codigo_barras, nombre, categoria, marca, modelo_compatible, stock_actual, stock_minimo, precio_compra, precio_venta, ubicacion_almacen, estado) FROM stdin;
1	PROD-001	Aceite de Motor 10W-40	Lubricantes	Motul	\N	20	0	50.00	80.00	\N	Activo
3	PROD-003	Pastillas de Freno Delanteras	Frenos	Brembo	\N	10	0	80.00	150.00	\N	Activo
5	PROD-005	Filtro de Aire	Consumibles	K&N	\N	12	0	40.00	75.00	\N	Activo
2	PROD-002	Bujía Iridium	eléctrico	NGK	\N	14	0	30.00	60.00	\N	Activo
4	PROD-004	Llanta Trasera 140/60	Neum├íticos	Pirelli	\N	15	0	300.00	450.00	\N	Activo
\.

COPY public.compra (codigo, id_proveedor, numero_factura, fecha, subtotal, impuesto, total, metodo_pago, estado) FROM stdin;
1	1	FAC-5050	2026-04-13	1000.00	130.00	1000.00	Transferencia	Completada
2	2	FAC-1020	2026-04-13	1500.00	195.00	1500.00	Efectivo	Completada
3	2	FAC-NUEVA-777	2026-04-13	3000.00	390.00	3390.00	Efectivo	Completada
\.

COPY public.detallecompra (codigo, id_compra, id_producto, cantidad, precio_compra, subtotal) FROM stdin;
1	1	1	10	50.00	500.00
2	1	5	10	40.00	400.00
3	2	4	5	300.00	1500.00
4	3	4	10	300.00	3000.00
\.

COPY public.cotizacion (codigo, id_cliente, id_motocicleta, fecha_emision, fecha_validez, subtotal, impuesto, total, estado) FROM stdin;
1	2	2	2026-04-13	2026-04-05	600.00	0.00	600.00	Pendiente
2	3	4	2026-04-13	2026-04-02	200.00	0.00	200.00	Aprobada
3	1	1	2026-04-13	2026-04-20	0.00	0.00	0.00	Pendiente
\.

COPY public.detallecotizacion (codigo, id_cotizacion, tipo, descripcion, cantidad, precio_unitario, subtotal) FROM stdin;
1	1	Repuesto	Pastillas de Freno	1	150.00	150.00
2	1	Repuesto	Llanta Trasera Pirelli	1	450.00	450.00
3	2	Mano de Obra	Ajuste de kit de arrastre	1	50.00	50.00
4	2	Mano de Obra	Revisión sistema eléctrico	1	150.00	150.00
\.

COPY public.ordentrabajo (codigo, id_cotizacion, id_cliente, id_motocicleta, id_mecanico, fecha_creacion, fecha_inicio, fecha_fin, kilometraje_ingreso, estado, prioridad, costo_mano_obra, costo_repuestos, total) FROM stdin;
1	\N	1	1	2	2026-04-13	2026-03-20	2026-03-21	5400.00	Finalizado	Normal	100.00	140.00	240.00
3	\N	3	4	2	2026-04-13	2026-03-26	2026-04-13	18500.00	Finalizado	Normal	50.00	60.00	110.00
2	\N	2	2	3	2026-04-13	2026-03-25	\N	15150.00	Esperando repuesto	Normal	0.00	0.00	0.00
\.

COPY public.detalleordentrabajo (codigo, id_orden_trabajo, id_producto, tipo, descripcion, cantidad, provisto_por_cliente, precio_unitario, subtotal) FROM stdin;
1	1	1	Repuesto	Cambio de Aceite Motul	1	f	80.00	80.00
2	1	2	Repuesto	Cambio de Bujía NGK	1	t	0.00	0.00
3	1	\N	Mano de Obra	Servicio de Mantenimiento General	1	f	100.00	100.00
4	3	2	Repuesto	Bujía Iridium nueva	1	f	60.00	60.00
5	3	\N	Mano de Obra	Cambio de Bujía y limpieza	1	f	50.00	50.00
6	2	3	Repuesto	Pastillas de freno traídas por el dueño	1	t	0.00	0.00
\.

COPY public.notaservicio (codigo, id_orden_trabajo, id_cliente, fecha_emision, total_repuestos, total_mano_obra, total_general, observaciones, estado_pago) FROM stdin;
1	1	1	2026-04-13	80.00	100.00	180.00	Cliente trajo su propia Bujía	Pagado
2	3	3	2026-04-13	60.00	50.00	110.00	Se cambió la bujía y se entregó al cliente Ana Roca	Pendiente
\.

COPY public.notatrabajo (codigo, id_orden_trabajo, id_mecanico, fecha_hora, contenido, tipo_nota) FROM stdin;
1	2	2	2026-04-13 05:30:28.620334	Se detect├│ que el disco de freno está pandeado. Se recomienda cambio.	diagnóstico
2	2	2	2026-04-13 05:30:28.620334	El cliente autorizó el cambio de disco, esperando que llegue el repuesto.	Avance
3	3	3	2026-04-13 05:30:28.620334	La moto ingresa con falla de encendido intermitente. Se revisará la batería.	diagnóstico
4	3	2	2026-04-13 05:30:28.791839	Cambio de estado autom├ítico de En Revisión a Finalizado	Sistema
\.

COPY public.factura (codigo, id_nota_servicio, numero_autorizacion, fecha_emision, monto_servicio_facturado, impuesto, total_facturado, nit_cliente, razon_social) FROM stdin;
1	1	AUT-998877	2026-04-13	100.00	13.00	113.00	8899776	Maria Lopez
2	2	AUT-925914	2026-04-13	50.00	6.50	56.50	1122334	Ana Roca
\.

COPY public.bitacora (codigo, id_usuario, fecha_hora, accion, descripcion) FROM stdin;
1	2	2026-04-13 05:30:28.791839	ACTUALIZACI├ôN	Maria (Recepcionista) cambió el estado de la Orden 3 a "Finalizado"
8	1	2026-04-13 08:29:38.134014	CREACIÓN	Registró al nuevo usuario: Usuario Auditoria con el rol Mecánico.
2	1	2026-04-13 08:29:58.434126	LOGIN	El usuario Admin Principal inició sesión en el sistema.
3	1	2026-04-13 08:29:58.434126	LOGOUT	El usuario Admin Principal cerró su sesión.
4	1	2026-04-13 08:29:58.434126	LOGIN	El usuario Admin Principal inició sesión en el sistema.
5	1	2026-04-13 08:29:58.434126	LOGOUT	El usuario Admin Principal cerró su sesión.
6	4	2026-04-13 08:29:58.434126	LOGIN	El usuario Clark Kent (Mecánico) inició sesión en el sistema.
7	4	2026-04-13 08:29:58.434126	LOGOUT	El usuario Clark Kent (Mecánico) cerró su sesión.
9	1	2026-04-13 08:40:08.811627	LOGIN	El usuario Admin Principal inició sesión en el sistema.
10	3	2026-04-13 08:40:19.865747	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
11	3	2026-04-13 08:40:33.670073	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
12	1	2026-04-13 08:46:17.107769	LOGIN	El usuario Admin Principal inició sesión en el sistema.
13	1	2026-04-13 08:55:07.800083	LOGIN	El usuario Admin Principal inició sesión en el sistema.
14	1	2026-04-13 15:19:52.890348	LOGIN	El usuario Admin Principal inició sesión en el sistema.
15	1	2026-04-13 15:21:09.504179	CREACIÓN	Registró al nuevo usuario: Lisa con el rol Cliente.
16	1	2026-04-13 15:21:43.624161	LOGOUT	El usuario Admin Principal cerró su sesión.
17	1	2026-04-13 19:02:17.641852	LOGIN	El usuario Admin Principal inició sesión en el sistema.
18	1	2026-04-13 19:02:17.905858	LOGOUT	El usuario Admin Principal cerró su sesión.
19	1	2026-04-13 19:10:42.433716	LOGIN	El usuario Admin Principal inició sesión en el sistema.
20	1	2026-04-13 19:14:52.784828	LOGIN	El usuario Admin Principal inició sesión en el sistema.
21	1	2026-04-13 19:19:25.127221	LOGIN	El usuario Admin Principal inició sesión en el sistema.
22	1	2026-04-13 19:20:13.258969	LOGIN	El usuario Admin Principal inició sesión en el sistema.
23	1	2026-04-13 19:20:13.696864	CREACIÓN	Registró al nuevo usuario: Recep Smoke 20260413152012 con el rol Recepcionista.
24	9	2026-04-13 19:20:13.975609	LOGIN	El usuario Recep Smoke 20260413152012 inició sesión en el sistema.
25	9	2026-04-13 19:20:14.130198	MODIFICACIÓN	Actualizó su informaci├│n de perfil.
26	9	2026-04-13 19:20:14.740736	MODIFICACIÓN	Actualizó su contraseña de acceso.
27	9	2026-04-13 19:20:15.055307	LOGIN	El usuario Recep Smoke Edit 20260413152012 inició sesión en el sistema.
28	1	2026-04-13 19:20:15.128019	CREACIÓN	Registró cliente: Cliente Smoke 20260413152012 (SMK-20260413152012).
29	1	2026-04-13 19:20:15.300488	CREACIÓN	Registró motocicleta placa SMK152012 para cliente ID 5.
30	1	2026-04-13 19:20:15.449384	ELIMINACIÓN	Eliminó motocicleta placa SMK152012.
31	1	2026-04-13 19:20:15.52312	ELIMINACIÓN	Eliminó cliente: Cliente Smoke 20260413152012.
32	1	2026-04-13 19:20:30.274128	LOGIN	El usuario Admin Principal inició sesión en el sistema.
33	1	2026-04-13 19:21:23.458652	LOGIN	El usuario Admin Principal inició sesión en el sistema.
34	1	2026-04-13 19:25:02.876023	LOGIN	El usuario Admin Principal inició sesión en el sistema.
35	1	2026-04-13 19:26:49.714017	LOGOUT	El usuario Admin Principal cerró su sesión.
36	1	2026-04-13 19:26:59.954753	LOGIN	El usuario Admin Principal inició sesión en el sistema.
37	1	2026-04-13 19:27:06.757568	LOGOUT	El usuario Admin Principal cerró su sesión.
38	1	2026-04-13 19:40:17.551128	LOGIN	El usuario Admin Principal inició sesión en el sistema.
39	1	2026-04-13 19:40:17.668367	MODIFICACIÓN	Actualizó el rol: Administrador_EDIT_4017.
40	1	2026-04-13 19:41:12.73042	LOGIN	El usuario Admin Principal inició sesión en el sistema.
41	1	2026-04-13 19:41:12.867294	MODIFICACIÓN	Actualizó el rol: Recepcionista.
42	1	2026-04-13 19:41:13.02884	MODIFICACIÓN	Actualizó el privilegio: Gestionar Usuarios.
43	1	2026-04-13 19:41:13.149575	MODIFICACIÓN	Actualizó usuario Maria (Recepcionista) (estado: Inactivo, rol: Recepcionista).
44	1	2026-04-13 19:41:13.246395	MODIFICACIÓN	Actualizó usuario Maria (Recepcionista) (estado: Activo, rol: Recepcionista).
45	1	2026-04-13 19:41:32.949446	LOGIN	El usuario Admin Principal inició sesión en el sistema.
46	1	2026-04-13 19:53:58.242692	LOGIN	El usuario Admin Principal inició sesión en el sistema.
47	1	2026-04-13 19:53:58.271527	SOLICITUD_RESET	Solicit├│ recuperaci├│n de contraseña por correo.
48	1	2026-04-13 19:53:58.624485	CREACIÓN	Registró al nuevo usuario: Cliente Prueba Temporal con el rol Mecánico.
52	1	2026-04-13 19:54:00.9255	RESET_PASSWORD	Restableci├│ su contraseña mediante enlace de recuperaci├│n.
53	1	2026-04-13 19:54:01.29143	LOGIN	El usuario Admin Principal inició sesión en el sistema.
54	1	2026-04-13 19:54:27.564128	LOGIN	El usuario Admin Principal inició sesión en el sistema.
55	1	2026-04-13 19:54:27.590657	CREACIÓN	Registró cliente: Maria Lopez (COT-20260413155427).
56	1	2026-04-13 19:54:27.746281	CREACIÓN	Registró motocicleta placa MC155427 para cliente ID 6.
57	1	2026-04-13 19:54:29.048144	CREACIÓN	Generó usuario cliente 'marialopez' al aceptar cotización 4.
58	1	2026-04-13 19:54:29.0514	MODIFICACIÓN	Aprobó cotización 4 del cliente Maria Lopez.
62	1	2026-04-13 19:54:45.791438	LOGIN	El usuario Admin Principal inició sesión en el sistema.
63	1	2026-04-13 19:54:47.042232	RESET_PASSWORD	Restableci├│ su contraseña mediante enlace de recuperaci├│n.
64	1	2026-04-13 19:54:47.392909	LOGIN	El usuario Admin Principal inició sesión en el sistema.
65	1	2026-04-13 19:54:47.964814	MODIFICACIÓN	Actualizó su contraseña de acceso.
66	1	2026-04-13 20:56:27.512649	LOGIN	El usuario Admin Principal inició sesión en el sistema.
67	1	2026-04-13 20:56:27.928293	SOLICITUD_RESET	Solicit├│ recuperaci├│n de contraseña por correo.
68	1	2026-04-13 20:56:42.07866	LOGIN	El usuario Admin Principal inició sesión en el sistema.
69	1	2026-04-13 20:56:42.114565	CREACIÓN	Registró cliente: Ana Perez (COT2-20260413165642).
70	1	2026-04-13 20:56:42.37294	CREACIÓN	Registró motocicleta placa AP165642 para cliente ID 7.
71	1	2026-04-13 20:56:44.028608	CREACIÓN	Generó usuario cliente 'anaperez' al aceptar cotización 5.
72	1	2026-04-13 20:56:44.032076	MODIFICACIÓN	Aprobó cotización 5 del cliente Ana Perez.
73	12	2026-04-13 20:56:44.577295	LOGIN	El usuario Ana Perez inició sesión en el sistema.
74	12	2026-04-13 20:56:45.171498	MODIFICACIÓN	cambió su contraseña temporal obligatoria.
75	12	2026-04-13 20:56:45.835749	LOGIN	El usuario Ana Perez inició sesión en el sistema.
76	1	2026-04-13 20:56:48.400487	LOGIN	El usuario Admin Principal inició sesión en el sistema.
77	1	2026-04-13 21:08:27.95289	LOGIN	El usuario Admin Principal inició sesión en el sistema.
78	2	2026-04-13 21:08:30.940436	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
79	1	2026-04-13 21:09:11.351065	LOGIN	El usuario Admin Principal inició sesión en el sistema.
80	2	2026-04-13 21:09:11.641154	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
81	1	2026-04-13 21:09:12.340995	CREACIÓN	Creó el rol: rol_tmp_c1_d010dd.
82	1	2026-04-13 21:09:12.808923	CREACIÓN	Creó el privilegio: priv_tmp_c1_68e4e5.
83	1	2026-04-13 21:09:13.684665	CREACIÓN	Registró al nuevo usuario: Tmp C1 con el rol Recepcionista.
84	1	2026-04-13 21:09:13.98248	CREACIÓN	Registró cliente: Cliente Tmp C1 (C1TMP897596).
85	1	2026-04-13 21:09:14.212807	MODIFICACIÓN	Actualizó cliente: Cliente Tmp C1 Edit.
86	1	2026-04-13 21:09:14.339164	CREACIÓN	Registró motocicleta placa C1142 para cliente ID 8.
87	1	2026-04-13 21:09:14.545221	MODIFICACIÓN	Actualizó motocicleta placa C1142.
88	1	2026-04-13 21:09:14.573548	ELIMINACIÓN	Eliminó motocicleta placa C1142.
89	1	2026-04-13 21:09:14.674593	ELIMINACIÓN	Eliminó cliente: Cliente Tmp C1 Edit.
90	1	2026-04-13 21:09:14.888401	MODIFICACIÓN	Actualizó su informaci├│n de perfil.
91	1	2026-04-13 21:09:14.980576	LOGOUT	El usuario Admin Principal cerró su sesión.
92	1	2026-04-13 21:09:52.556104	LOGIN	El usuario Admin Principal inició sesión en el sistema.
93	2	2026-04-13 21:09:52.836365	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
94	1	2026-04-13 21:09:53.604256	LOGOUT	El usuario Admin Principal cerró su sesión.
95	1	2026-04-13 21:37:25.792416	LOGIN	El usuario Admin Principal inició sesión en el sistema.
96	1	2026-04-14 06:39:45.214763	LOGIN	El usuario Admin Principal inició sesión en el sistema.
97	1	2026-04-14 06:47:13.828018	LOGOUT	El usuario Admin Principal cerró su sesión.
98	1	2026-04-14 06:47:46.056082	LOGIN	El usuario Admin Principal inició sesión en el sistema.
99	1	2026-04-14 06:49:51.134172	CREACIÓN	Registró cliente: Alex Arg (6666668).
100	1	2026-04-14 06:50:04.528157	LOGOUT	El usuario Admin Principal cerró su sesión.
101	1	2026-04-14 06:53:22.746195	LOGIN	El usuario Admin Principal inició sesión en el sistema.
102	1	2026-04-14 06:53:41.896055	MODIFICACIÓN	Desactiv├│ cliente: Alex Arg.
103	1	2026-04-14 06:54:28.04277	LOGOUT	El usuario Admin Principal cerró su sesión.
104	1	2026-04-14 06:55:00.342958	LOGIN	El usuario Admin Principal inició sesión en el sistema.
105	1	2026-04-14 06:55:27.173273	LOGOUT	El usuario Admin Principal cerró su sesión.
106	5	2026-04-14 06:55:35.107271	LOGIN	El usuario Homero inició sesión en el sistema.
107	5	2026-04-14 06:56:12.066229	LOGOUT	El usuario Homero cerró su sesión.
108	1	2026-04-14 06:56:28.11386	LOGIN	El usuario Admin Principal inició sesión en el sistema.
109	1	2026-04-14 06:57:24.044029	ELIMINACIÓN	Eliminó el privilegio: priv_tmp_c1_68e4e5.
110	1	2026-04-14 06:57:26.828701	ELIMINACIÓN	Eliminó el rol: rol_tmp_c1_d010dd.
111	1	2026-04-14 06:57:57.332597	MODIFICACIÓN	Actualizó usuario Tmp C1 (estado: Inactivo, rol: Recepcionista).
112	1	2026-04-14 06:58:09.823593	MODIFICACIÓN	Actualizó usuario Recep Smoke Edit 20260413152012 (estado: Inactivo, rol: Recepcionista).
113	1	2026-04-14 07:13:48.316539	LOGOUT	El usuario Admin Principal cerró su sesión.
114	1	2026-04-14 07:18:33.289249	LOGIN	El usuario Admin Principal inició sesión en el sistema.
115	1	2026-04-14 07:19:12.339692	CREACIÓN	Registró al nuevo usuario: Maria Lopez con el rol Cliente.
116	1	2026-04-14 07:19:23.279253	LOGOUT	El usuario Admin Principal cerró su sesión.
117	14	2026-04-14 07:19:36.787644	LOGIN	El usuario Maria Lopez inició sesión en el sistema.
118	14	2026-04-14 07:20:07.651308	MODIFICACIÓN	cambió su contraseña temporal obligatoria.
119	14	2026-04-14 07:20:43.96908	LOGIN	El usuario Maria Lopez inició sesión en el sistema.
120	14	2026-04-14 07:21:04.83249	LOGOUT	El usuario Maria Lopez cerró su sesión.
121	1	2026-04-14 07:24:13.640527	LOGIN	El usuario Admin Principal inició sesión en el sistema.
122	1	2026-04-14 07:32:11.624959	LOGOUT	El usuario Admin Principal cerró su sesión.
123	14	2026-04-14 07:32:28.250524	LOGIN	El usuario Maria Lopez inició sesión en el sistema.
124	14	2026-04-14 07:33:23.969427	LOGOUT	El usuario Maria Lopez cerró su sesión.
125	14	2026-04-14 07:35:17.570497	LOGIN	El usuario Maria Lopez inició sesión en el sistema.
126	14	2026-04-14 07:42:45.998638	LOGOUT	El usuario Maria Lopez cerró su sesión.
127	14	2026-04-14 07:54:26.121356	LOGIN	El usuario Maria Lopez inició sesión en el sistema.
128	14	2026-04-14 07:54:31.932507	LOGOUT	El usuario Maria Lopez cerró su sesión.
129	1	2026-04-14 07:54:40.163246	LOGIN	El usuario Admin Principal inició sesión en el sistema.
130	1	2026-04-14 07:54:55.950149	MODIFICACIÓN	Actualizó usuario Ana Perez (estado: Inactivo, rol: Cliente).
131	1	2026-04-14 07:55:08.970338	LOGOUT	El usuario Admin Principal cerró su sesión.
132	2	2026-04-14 07:55:16.878795	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
133	2	2026-04-14 07:55:42.707115	LOGOUT	El usuario Maria (Recepcionista) cerró su sesión.
134	1	2026-04-14 07:55:54.049701	LOGIN	El usuario Admin Principal inició sesión en el sistema.
135	1	2026-04-14 07:56:10.697163	LOGOUT	El usuario Admin Principal cerró su sesión.
136	3	2026-04-14 07:56:20.576013	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
137	3	2026-04-14 07:56:24.269754	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
138	3	2026-04-14 07:56:25.016463	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
139	3	2026-04-14 07:56:25.587199	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
140	4	2026-04-14 07:56:30.033865	LOGIN	El usuario Clark Kent (Mecánico) inició sesión en el sistema.
141	4	2026-04-14 07:56:37.514433	LOGIN	El usuario Clark Kent (Mecánico) inició sesión en el sistema.
142	4	2026-04-14 07:56:48.947074	LOGIN	El usuario Clark Kent (Mecánico) inició sesión en el sistema.
143	4	2026-04-14 07:56:51.927838	LOGIN	El usuario Clark Kent (Mecánico) inició sesión en el sistema.
144	4	2026-04-14 07:56:53.750008	LOGIN	El usuario Clark Kent (Mecánico) inició sesión en el sistema.
145	3	2026-04-14 08:00:10.458308	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
146	3	2026-04-14 08:01:03.120942	LOGOUT	El usuario Carlos (Mecánico) cerró su sesión.
147	3	2026-04-14 08:01:13.771814	SOLICITUD_RESET	Solicit├│ recuperaci├│n de contraseña por correo.
148	3	2026-04-14 08:01:48.424028	RESET_PASSWORD	Restableci├│ su contraseña mediante enlace de recuperaci├│n.
149	3	2026-04-14 08:02:04.837287	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
150	3	2026-04-14 08:02:19.453302	LOGOUT	El usuario Carlos (Mecánico) cerró su sesión.
151	3	2026-04-14 08:02:31.525808	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
152	3	2026-04-14 08:02:48.37146	MODIFICACIÓN	Actualizó su contraseña de acceso.
153	1	2026-04-14 08:03:06.282863	LOGIN	El usuario Admin Principal inició sesión en el sistema.
154	1	2026-04-14 08:03:38.237098	LOGOUT	El usuario Admin Principal cerró su sesión.
155	1	2026-04-14 13:49:48.520396	LOGIN	El usuario Admin Principal inició sesión en el sistema.
156	1	2026-04-14 13:50:57.340038	LOGOUT	El usuario Admin Principal cerró su sesión.
157	14	2026-04-14 13:51:10.781684	LOGIN	El usuario Maria Lopez inició sesión en el sistema.
158	14	2026-04-14 14:01:04.517262	LOGOUT	El usuario Maria Lopez cerró su sesión.
159	3	2026-04-14 14:01:16.976287	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
160	3	2026-04-14 14:01:24.447553	LOGOUT	El usuario Carlos (Mecánico) cerró su sesión.
161	3	2026-04-14 14:24:30.669467	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
162	3	2026-04-14 14:24:32.737688	LOGOUT	El usuario Carlos (Mecánico) cerró su sesión.
163	3	2026-04-14 14:25:17.115101	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
164	3	2026-04-14 14:25:20.971691	LOGOUT	El usuario Carlos (Mecánico) cerró su sesión.
165	1	2026-04-14 14:25:30.775345	LOGIN	El usuario Admin Principal inició sesión en el sistema.
166	1	2026-04-14 14:28:00.144537	LOGOUT	El usuario Admin Principal cerró su sesión.
167	3	2026-04-14 14:29:18.592054	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
168	3	2026-04-14 14:29:21.958935	LOGOUT	El usuario Carlos (Mecánico) cerró su sesión.
169	1	2026-04-14 14:31:34.510151	LOGIN	El usuario Admin Principal inició sesión en el sistema.
170	1	2026-04-14 14:31:42.879336	LOGOUT	El usuario Admin Principal cerró su sesión.
171	1	2026-04-14 14:40:26.8663	LOGIN	El usuario Admin Principal inició sesión en el sistema.
172	1	2026-04-14 14:40:33.926731	LOGOUT	El usuario Admin Principal cerró su sesión.
173	3	2026-04-14 14:40:44.052537	BLOQUEO_CUENTA	Cuenta bloqueada por 1 minuto tras 3 intentos fallidos de contraseña para el usuario Carlos (Mecánico).
174	3	2026-04-14 14:41:48.838751	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
175	3	2026-04-14 14:41:52.105208	LOGOUT	El usuario Carlos (Mecánico) cerró su sesión.
176	1	2026-04-14 14:41:53.81641	LOGIN	El usuario Admin Principal inició sesión en el sistema.
177	1	2026-04-14 14:42:54.932554	LOGOUT	El usuario Admin Principal cerró su sesión.
178	1	2026-04-14 15:14:50.892208	LOGIN	El usuario Admin Principal inició sesión en el sistema.
179	1	2026-04-14 15:16:57.0736	CREACIÓN	Registró al nuevo usuario: Ana Roca con el rol Cliente.
180	1	2026-04-14 15:17:09.095169	LOGOUT	El usuario Admin Principal cerró su sesión.
181	15	2026-04-14 15:17:20.216802	LOGIN	El usuario Ana Roca inició sesión en el sistema.
182	15	2026-04-14 15:17:32.654032	MODIFICACIÓN	cambió su contraseña temporal obligatoria.
183	15	2026-04-14 15:17:54.288361	LOGIN	El usuario Ana Roca inició sesión en el sistema.
184	15	2026-04-14 15:18:57.293169	LOGOUT	El usuario Ana Roca cerró su sesión.
185	1	2026-04-14 15:18:59.957182	LOGIN	El usuario Admin Principal inició sesión en el sistema.
186	1	2026-04-14 15:19:35.119706	LOGOUT	El usuario Admin Principal cerró su sesión.
187	1	2026-04-14 15:20:16.580041	LOGIN	El usuario Admin Principal inició sesión en el sistema.
188	15	2026-04-14 15:21:39.115221	LOGIN	El usuario Ana Roca inició sesión en el sistema.
189	15	2026-04-14 15:22:05.655119	LOGOUT	El usuario Ana Roca cerró su sesión.
190	3	2026-04-14 15:22:18.860159	LOGIN	El usuario Carlos (Mecánico) inició sesión en el sistema.
191	3	2026-04-14 15:22:33.729315	LOGOUT	El usuario Carlos (Mecánico) cerró su sesión.
192	2	2026-04-14 15:23:31.49135	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
193	1	2026-04-14 15:23:44.299307	LOGOUT	El usuario Admin Principal cerró su sesión.
194	1	2026-04-14 15:24:05.627977	LOGIN	El usuario Admin Principal inició sesión en el sistema.
195	2	2026-04-14 15:37:51.029448	LOGOUT	El usuario Maria (Recepcionista) cerró su sesión.
196	1	2026-04-14 15:38:00.877256	LOGOUT	El usuario Admin Principal cerró su sesión.
\.

SELECT pg_catalog.setval('public.bitacora_codigo_seq', 196, true);
SELECT pg_catalog.setval('public.cliente_codigo_seq', 9, true);
SELECT pg_catalog.setval('public.compra_codigo_seq', 3, true);
SELECT pg_catalog.setval('public.cotizacion_codigo_seq', 5, true);
SELECT pg_catalog.setval('public.detallecompra_codigo_seq', 4, true);
SELECT pg_catalog.setval('public.detallecotizacion_codigo_seq', 4, true);
SELECT pg_catalog.setval('public.detalleordentrabajo_codigo_seq', 6, true);
SELECT pg_catalog.setval('public.factura_codigo_seq', 2, true);
SELECT pg_catalog.setval('public.motocicleta_codigo_seq', 8, true);
SELECT pg_catalog.setval('public.notaservicio_codigo_seq', 2, true);
SELECT pg_catalog.setval('public.notatrabajo_codigo_seq', 4, true);
SELECT pg_catalog.setval('public.ordentrabajo_codigo_seq', 3, true);
SELECT pg_catalog.setval('public.privilegio_codigo_seq', 9, true);
SELECT pg_catalog.setval('public.producto_codigo_seq', 5, true);
SELECT pg_catalog.setval('public.proveedor_codigo_seq', 2, true);
SELECT pg_catalog.setval('public.rol_codigo_seq', 5, true);
SELECT pg_catalog.setval('public.usuario_codigo_seq', 15, true);



select *
from cliente;


SELECT COUNT(*) FROM permiso_modulo;  -- Debe ser > 0