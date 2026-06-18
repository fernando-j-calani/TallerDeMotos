--
-- PostgreSQL database dump
--

\restrict WmM0V1rIT6QtZIcdVPqtVC9bYf59N4ew8Up3uMyIoIXdppebXDKs16u73AcSTlq

-- Dumped from database version 15.18 (Debian 15.18-1.pgdg13+1)
-- Dumped by pg_dump version 15.18 (Debian 15.18-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.usuario DROP CONSTRAINT IF EXISTS usuario_id_rol_fkey;
ALTER TABLE IF EXISTS ONLY public.seguimiento DROP CONSTRAINT IF EXISTS seguimiento_id_usuario_aeb0ae4c_fk_usuario_codigo;
ALTER TABLE IF EXISTS ONLY public.seguimiento DROP CONSTRAINT IF EXISTS seguimiento_id_cliente_ddf39782_fk_cliente_codigo;
ALTER TABLE IF EXISTS ONLY public.rol_privilegio DROP CONSTRAINT IF EXISTS rol_privilegio_id_rol_fkey;
ALTER TABLE IF EXISTS ONLY public.rol_privilegio DROP CONSTRAINT IF EXISTS rol_privilegio_id_privilegio_fkey;
ALTER TABLE IF EXISTS ONLY public.permiso_modulo DROP CONSTRAINT IF EXISTS permiso_modulo_id_rol_fkey;
ALTER TABLE IF EXISTS ONLY public.ordentrabajo DROP CONSTRAINT IF EXISTS ordentrabajo_id_motocicleta_fkey;
ALTER TABLE IF EXISTS ONLY public.ordentrabajo DROP CONSTRAINT IF EXISTS ordentrabajo_id_mecanico_fkey;
ALTER TABLE IF EXISTS ONLY public.ordentrabajo DROP CONSTRAINT IF EXISTS ordentrabajo_id_cotizacion_fkey;
ALTER TABLE IF EXISTS ONLY public.ordentrabajo DROP CONSTRAINT IF EXISTS ordentrabajo_id_cliente_fkey;
ALTER TABLE IF EXISTS ONLY public.notatrabajo DROP CONSTRAINT IF EXISTS notatrabajo_id_orden_trabajo_fkey;
ALTER TABLE IF EXISTS ONLY public.notatrabajo DROP CONSTRAINT IF EXISTS notatrabajo_id_mecanico_fkey;
ALTER TABLE IF EXISTS ONLY public.notaservicio DROP CONSTRAINT IF EXISTS notaservicio_id_orden_trabajo_fkey;
ALTER TABLE IF EXISTS ONLY public.notaservicio DROP CONSTRAINT IF EXISTS notaservicio_id_cliente_fkey;
ALTER TABLE IF EXISTS ONLY public.motocicleta DROP CONSTRAINT IF EXISTS motocicleta_id_cliente_fkey;
ALTER TABLE IF EXISTS ONLY public.factura DROP CONSTRAINT IF EXISTS factura_id_nota_servicio_fkey;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_user_id_c564eba6_fk_auth_user_id;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_content_type_id_c4bce8eb_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.detalleordentrabajo DROP CONSTRAINT IF EXISTS detalleordentrabajo_id_producto_fkey;
ALTER TABLE IF EXISTS ONLY public.detalleordentrabajo DROP CONSTRAINT IF EXISTS detalleordentrabajo_id_orden_trabajo_fkey;
ALTER TABLE IF EXISTS ONLY public.detallecotizacion DROP CONSTRAINT IF EXISTS detallecotizacion_id_cotizacion_fkey;
ALTER TABLE IF EXISTS ONLY public.detallecompra DROP CONSTRAINT IF EXISTS detallecompra_id_producto_fkey;
ALTER TABLE IF EXISTS ONLY public.detallecompra DROP CONSTRAINT IF EXISTS detallecompra_id_compra_fkey;
ALTER TABLE IF EXISTS ONLY public.cotizacion DROP CONSTRAINT IF EXISTS cotizacion_id_motocicleta_fkey;
ALTER TABLE IF EXISTS ONLY public.cotizacion DROP CONSTRAINT IF EXISTS cotizacion_id_cliente_fkey;
ALTER TABLE IF EXISTS ONLY public.compra DROP CONSTRAINT IF EXISTS compra_id_proveedor_fkey;
ALTER TABLE IF EXISTS ONLY public.bitacora DROP CONSTRAINT IF EXISTS bitacora_id_usuario_fkey;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_user_id_6a12ed8b_fk_auth_user_id;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_group_id_97559544_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_2f476e4b_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_b120cbf9_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissio_permission_id_84c5c92e_fk_auth_perm;
DROP TRIGGER IF EXISTS trg_verificar_stock ON public.detalleordentrabajo;
DROP TRIGGER IF EXISTS trg_verificar_caducidad ON public.cotizacion;
DROP TRIGGER IF EXISTS trg_totales_orden ON public.detalleordentrabajo;
DROP TRIGGER IF EXISTS trg_totales_cotizacion ON public.detallecotizacion;
DROP TRIGGER IF EXISTS trg_totales_compra ON public.detallecompra;
DROP TRIGGER IF EXISTS trg_precio_cero_cliente ON public.detalleordentrabajo;
DROP TRIGGER IF EXISTS trg_generar_factura_legal ON public.notaservicio;
DROP TRIGGER IF EXISTS trg_disminuir_stock ON public.detalleordentrabajo;
DROP TRIGGER IF EXISTS trg_aumentar_stock ON public.detallecompra;
DROP TRIGGER IF EXISTS trg_auditoria_estado ON public.ordentrabajo;
DROP TRIGGER IF EXISTS trg_auditoria_bitacora_orden ON public.ordentrabajo;
DROP INDEX IF EXISTS public.seguimiento_id_usuario_aeb0ae4c;
DROP INDEX IF EXISTS public.seguimiento_id_cliente_ddf39782;
DROP INDEX IF EXISTS public.permiso_modulo_unique_idx;
DROP INDEX IF EXISTS public.django_session_session_key_c0390e0f_like;
DROP INDEX IF EXISTS public.django_session_expire_date_a5c62663;
DROP INDEX IF EXISTS public.django_admin_log_user_id_c564eba6;
DROP INDEX IF EXISTS public.django_admin_log_content_type_id_c4bce8eb;
DROP INDEX IF EXISTS public.auth_user_username_6821ab7c_like;
DROP INDEX IF EXISTS public.auth_user_user_permissions_user_id_a95ead1b;
DROP INDEX IF EXISTS public.auth_user_user_permissions_permission_id_1fbb5f2c;
DROP INDEX IF EXISTS public.auth_user_groups_user_id_6a12ed8b;
DROP INDEX IF EXISTS public.auth_user_groups_group_id_97559544;
DROP INDEX IF EXISTS public.auth_permission_content_type_id_2f476e4b;
DROP INDEX IF EXISTS public.auth_group_permissions_permission_id_84c5c92e;
DROP INDEX IF EXISTS public.auth_group_permissions_group_id_b120cbf9;
DROP INDEX IF EXISTS public.auth_group_name_a6ea08ec_like;
ALTER TABLE IF EXISTS ONLY public.usuario DROP CONSTRAINT IF EXISTS usuario_pkey;
ALTER TABLE IF EXISTS ONLY public.usuario DROP CONSTRAINT IF EXISTS usuario_email_key;
ALTER TABLE IF EXISTS ONLY public.seguimiento DROP CONSTRAINT IF EXISTS seguimiento_pkey;
ALTER TABLE IF EXISTS ONLY public.rol_privilegio DROP CONSTRAINT IF EXISTS rol_privilegio_pkey;
ALTER TABLE IF EXISTS ONLY public.rol DROP CONSTRAINT IF EXISTS rol_pkey;
ALTER TABLE IF EXISTS ONLY public.proveedor DROP CONSTRAINT IF EXISTS proveedor_pkey;
ALTER TABLE IF EXISTS ONLY public.producto DROP CONSTRAINT IF EXISTS producto_pkey;
ALTER TABLE IF EXISTS ONLY public.privilegio DROP CONSTRAINT IF EXISTS privilegio_pkey;
ALTER TABLE IF EXISTS ONLY public.permiso_modulo DROP CONSTRAINT IF EXISTS permiso_modulo_pkey;
ALTER TABLE IF EXISTS ONLY public.ordentrabajo DROP CONSTRAINT IF EXISTS ordentrabajo_pkey;
ALTER TABLE IF EXISTS ONLY public.notatrabajo DROP CONSTRAINT IF EXISTS notatrabajo_pkey;
ALTER TABLE IF EXISTS ONLY public.notaservicio DROP CONSTRAINT IF EXISTS notaservicio_pkey;
ALTER TABLE IF EXISTS ONLY public.motocicleta DROP CONSTRAINT IF EXISTS motocicleta_placa_key;
ALTER TABLE IF EXISTS ONLY public.motocicleta DROP CONSTRAINT IF EXISTS motocicleta_pkey;
ALTER TABLE IF EXISTS ONLY public.factura DROP CONSTRAINT IF EXISTS factura_pkey;
ALTER TABLE IF EXISTS ONLY public.django_session DROP CONSTRAINT IF EXISTS django_session_pkey;
ALTER TABLE IF EXISTS ONLY public.django_migrations DROP CONSTRAINT IF EXISTS django_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_app_label_model_76bd3d3b_uniq;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_pkey;
ALTER TABLE IF EXISTS ONLY public.detalleordentrabajo DROP CONSTRAINT IF EXISTS detalleordentrabajo_pkey;
ALTER TABLE IF EXISTS ONLY public.detallecotizacion DROP CONSTRAINT IF EXISTS detallecotizacion_pkey;
ALTER TABLE IF EXISTS ONLY public.detallecompra DROP CONSTRAINT IF EXISTS detallecompra_pkey;
ALTER TABLE IF EXISTS ONLY public.cotizacion DROP CONSTRAINT IF EXISTS cotizacion_pkey;
ALTER TABLE IF EXISTS ONLY public.compra DROP CONSTRAINT IF EXISTS compra_pkey;
ALTER TABLE IF EXISTS ONLY public.cliente DROP CONSTRAINT IF EXISTS cliente_pkey;
ALTER TABLE IF EXISTS ONLY public.cliente DROP CONSTRAINT IF EXISTS cliente_cedula_key;
ALTER TABLE IF EXISTS ONLY public.bitacora DROP CONSTRAINT IF EXISTS bitacora_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user DROP CONSTRAINT IF EXISTS auth_user_username_key;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permissions_user_id_permission_id_14a6b632_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user DROP CONSTRAINT IF EXISTS auth_user_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_user_id_group_id_94350c0c_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_codename_01ab375a_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_permission_id_0cd325b0_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_name_key;
ALTER TABLE IF EXISTS public.usuario ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.rol ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.proveedor ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.producto ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.privilegio ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.permiso_modulo ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ordentrabajo ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.notatrabajo ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.notaservicio ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.motocicleta ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.factura ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.detalleordentrabajo ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.detallecotizacion ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.detallecompra ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.cotizacion ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.compra ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.cliente ALTER COLUMN codigo DROP DEFAULT;
ALTER TABLE IF EXISTS public.bitacora ALTER COLUMN codigo DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.usuario_codigo_seq;
DROP TABLE IF EXISTS public.usuario;
DROP TABLE IF EXISTS public.seguimiento;
DROP TABLE IF EXISTS public.rol_privilegio;
DROP SEQUENCE IF EXISTS public.rol_codigo_seq;
DROP TABLE IF EXISTS public.rol;
DROP SEQUENCE IF EXISTS public.proveedor_codigo_seq;
DROP TABLE IF EXISTS public.proveedor;
DROP SEQUENCE IF EXISTS public.producto_codigo_seq;
DROP TABLE IF EXISTS public.producto;
DROP SEQUENCE IF EXISTS public.privilegio_codigo_seq;
DROP TABLE IF EXISTS public.privilegio;
DROP SEQUENCE IF EXISTS public.permiso_modulo_id_seq;
DROP TABLE IF EXISTS public.permiso_modulo;
DROP SEQUENCE IF EXISTS public.ordentrabajo_codigo_seq;
DROP TABLE IF EXISTS public.ordentrabajo;
DROP SEQUENCE IF EXISTS public.notatrabajo_codigo_seq;
DROP TABLE IF EXISTS public.notatrabajo;
DROP SEQUENCE IF EXISTS public.notaservicio_codigo_seq;
DROP TABLE IF EXISTS public.notaservicio;
DROP SEQUENCE IF EXISTS public.motocicleta_codigo_seq;
DROP TABLE IF EXISTS public.motocicleta;
DROP SEQUENCE IF EXISTS public.factura_codigo_seq;
DROP TABLE IF EXISTS public.factura;
DROP TABLE IF EXISTS public.django_session;
DROP TABLE IF EXISTS public.django_migrations;
DROP TABLE IF EXISTS public.django_content_type;
DROP TABLE IF EXISTS public.django_admin_log;
DROP SEQUENCE IF EXISTS public.detalleordentrabajo_codigo_seq;
DROP TABLE IF EXISTS public.detalleordentrabajo;
DROP SEQUENCE IF EXISTS public.detallecotizacion_codigo_seq;
DROP TABLE IF EXISTS public.detallecotizacion;
DROP SEQUENCE IF EXISTS public.detallecompra_codigo_seq;
DROP TABLE IF EXISTS public.detallecompra;
DROP SEQUENCE IF EXISTS public.cotizacion_codigo_seq;
DROP TABLE IF EXISTS public.cotizacion;
DROP SEQUENCE IF EXISTS public.compra_codigo_seq;
DROP TABLE IF EXISTS public.compra;
DROP SEQUENCE IF EXISTS public.cliente_codigo_seq;
DROP TABLE IF EXISTS public.cliente;
DROP SEQUENCE IF EXISTS public.bitacora_codigo_seq;
DROP TABLE IF EXISTS public.bitacora;
DROP TABLE IF EXISTS public.auth_user_user_permissions;
DROP TABLE IF EXISTS public.auth_user_groups;
DROP TABLE IF EXISTS public.auth_user;
DROP TABLE IF EXISTS public.auth_permission;
DROP TABLE IF EXISTS public.auth_group_permissions;
DROP TABLE IF EXISTS public.auth_group;
DROP FUNCTION IF EXISTS public.tf_verificar_stock();
DROP FUNCTION IF EXISTS public.tf_verificar_caducidad();
DROP FUNCTION IF EXISTS public.tf_totales_orden();
DROP FUNCTION IF EXISTS public.tf_totales_cotizacion();
DROP FUNCTION IF EXISTS public.tf_totales_compra();
DROP FUNCTION IF EXISTS public.tf_precio_cero_cliente();
DROP FUNCTION IF EXISTS public.tf_generar_factura_legal();
DROP FUNCTION IF EXISTS public.tf_disminuir_stock();
DROP FUNCTION IF EXISTS public.tf_aumentar_stock();
DROP FUNCTION IF EXISTS public.tf_auditoria_estado_orden();
DROP FUNCTION IF EXISTS public.tf_auditoria_bitacora_orden();
DROP PROCEDURE IF EXISTS public.pa_registrar_motocicleta(IN p_id_cliente integer, IN p_placa character varying, IN p_marca character varying, IN p_modelo character varying, IN p_anio integer, IN p_cilindraje character varying, IN p_color character varying);
DROP PROCEDURE IF EXISTS public.pa_registrar_compra(IN p_id_proveedor integer, IN p_factura character varying, IN p_metodo character varying);
DROP PROCEDURE IF EXISTS public.pa_registrar_cliente(IN p_cedula character varying, IN p_nombre character varying, IN p_telefono character varying, IN p_direccion text, IN p_email character varying);
DROP PROCEDURE IF EXISTS public.pa_registrar_bitacora(IN p_id_usuario integer, IN p_accion character varying, IN p_descripcion text);
DROP PROCEDURE IF EXISTS public.pa_generar_nota_servicio(IN p_id_orden integer, IN p_observaciones text);
DROP PROCEDURE IF EXISTS public.pa_crear_cotizacion(IN p_id_cliente integer, IN p_id_motocicleta integer);
DROP PROCEDURE IF EXISTS public.pa_baja_producto(IN p_id_producto integer);
DROP PROCEDURE IF EXISTS public.pa_asignar_mecanico(IN p_id_orden integer, IN p_id_mecanico integer);
DROP PROCEDURE IF EXISTS public.pa_aprobar_cotizacion_crear_orden(IN p_id_cotizacion integer);
DROP PROCEDURE IF EXISTS public.pa_agregar_nota(IN p_id_orden integer, IN p_id_mecanico integer, IN p_contenido text, IN p_tipo character varying);
DROP PROCEDURE IF EXISTS public.pa_actualizar_precio_producto(IN p_id_producto integer, IN p_nuevo_precio numeric);
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: usuario_taller
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO usuario_taller;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: usuario_taller
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pa_actualizar_precio_producto(integer, numeric); Type: PROCEDURE; Schema: public; Owner: usuario_taller
--

CREATE PROCEDURE public.pa_actualizar_precio_producto(IN p_id_producto integer, IN p_nuevo_precio numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Producto SET precio_venta = p_nuevo_precio WHERE codigo = p_id_producto;
END;
$$;


ALTER PROCEDURE public.pa_actualizar_precio_producto(IN p_id_producto integer, IN p_nuevo_precio numeric) OWNER TO usuario_taller;

--
-- Name: pa_agregar_nota(integer, integer, text, character varying); Type: PROCEDURE; Schema: public; Owner: usuario_taller
--

CREATE PROCEDURE public.pa_agregar_nota(IN p_id_orden integer, IN p_id_mecanico integer, IN p_contenido text, IN p_tipo character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO NotaTrabajo (id_orden_trabajo, id_mecanico, contenido, tipo_nota)
    VALUES (p_id_orden, p_id_mecanico, p_contenido, p_tipo);
END;
$$;


ALTER PROCEDURE public.pa_agregar_nota(IN p_id_orden integer, IN p_id_mecanico integer, IN p_contenido text, IN p_tipo character varying) OWNER TO usuario_taller;

--
-- Name: pa_aprobar_cotizacion_crear_orden(integer); Type: PROCEDURE; Schema: public; Owner: usuario_taller
--

CREATE PROCEDURE public.pa_aprobar_cotizacion_crear_orden(IN p_id_cotizacion integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_cliente INTEGER;
    v_moto INTEGER;
BEGIN
    UPDATE Cotizacion SET estado = 'Aprobada' WHERE codigo = p_id_cotizacion;
    SELECT id_cliente, id_motocicleta INTO v_cliente, v_moto FROM Cotizacion WHERE codigo = p_id_cotizacion;
    
    INSERT INTO OrdenTrabajo (id_cotizacion, id_cliente, id_motocicleta, estado, prioridad)
    VALUES (p_id_cotizacion, v_cliente, v_moto, 'En revisi??n', 'Normal');
END;
$$;


ALTER PROCEDURE public.pa_aprobar_cotizacion_crear_orden(IN p_id_cotizacion integer) OWNER TO usuario_taller;

--
-- Name: pa_asignar_mecanico(integer, integer); Type: PROCEDURE; Schema: public; Owner: usuario_taller
--

CREATE PROCEDURE public.pa_asignar_mecanico(IN p_id_orden integer, IN p_id_mecanico integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE OrdenTrabajo 
    SET id_mecanico = p_id_mecanico, estado = 'En proceso', fecha_inicio = CURRENT_DATE
    WHERE codigo = p_id_orden;
END;
$$;


ALTER PROCEDURE public.pa_asignar_mecanico(IN p_id_orden integer, IN p_id_mecanico integer) OWNER TO usuario_taller;

--
-- Name: pa_baja_producto(integer); Type: PROCEDURE; Schema: public; Owner: usuario_taller
--

CREATE PROCEDURE public.pa_baja_producto(IN p_id_producto integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Producto SET estado = 'Inactivo' WHERE codigo = p_id_producto;
END;
$$;


ALTER PROCEDURE public.pa_baja_producto(IN p_id_producto integer) OWNER TO usuario_taller;

--
-- Name: pa_crear_cotizacion(integer, integer); Type: PROCEDURE; Schema: public; Owner: usuario_taller
--

CREATE PROCEDURE public.pa_crear_cotizacion(IN p_id_cliente integer, IN p_id_motocicleta integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO Cotizacion (id_cliente, id_motocicleta, fecha_validez, subtotal, impuesto, total, estado)
    -- Suma 7 d??as exactos a la fecha actual para la caducidad
    VALUES (p_id_cliente, p_id_motocicleta, CURRENT_DATE + 7, 0, 0, 0, 'Pendiente');
END;
$$;


ALTER PROCEDURE public.pa_crear_cotizacion(IN p_id_cliente integer, IN p_id_motocicleta integer) OWNER TO usuario_taller;

--
-- Name: pa_generar_nota_servicio(integer, text); Type: PROCEDURE; Schema: public; Owner: usuario_taller
--

CREATE PROCEDURE public.pa_generar_nota_servicio(IN p_id_orden integer, IN p_observaciones text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_repuestos NUMERIC;
    v_mano_obra NUMERIC;
    v_cliente INTEGER;
BEGIN
    SELECT costo_repuestos, costo_mano_obra, id_cliente INTO v_repuestos, v_mano_obra, v_cliente
    FROM OrdenTrabajo WHERE codigo = p_id_orden;

    INSERT INTO NotaServicio (id_orden_trabajo, id_cliente, total_repuestos, total_mano_obra, total_general, observaciones)
    VALUES (p_id_orden, v_cliente, v_repuestos, v_mano_obra, (v_repuestos + v_mano_obra), p_observaciones);
    
    UPDATE OrdenTrabajo SET estado = 'Finalizado', fecha_fin = CURRENT_DATE WHERE codigo = p_id_orden;
END;
$$;


ALTER PROCEDURE public.pa_generar_nota_servicio(IN p_id_orden integer, IN p_observaciones text) OWNER TO usuario_taller;

--
-- Name: pa_registrar_bitacora(integer, character varying, text); Type: PROCEDURE; Schema: public; Owner: usuario_taller
--

CREATE PROCEDURE public.pa_registrar_bitacora(IN p_id_usuario integer, IN p_accion character varying, IN p_descripcion text)
    LANGUAGE plpgsql
    AS $$ 
BEGIN 
	INSERT INTO Bitacora (id_usuario, accion, descripcion) VALUES (p_id_usuario, p_accion, p_descripcion); 
END; 
$$;


ALTER PROCEDURE public.pa_registrar_bitacora(IN p_id_usuario integer, IN p_accion character varying, IN p_descripcion text) OWNER TO usuario_taller;

--
-- Name: pa_registrar_cliente(character varying, character varying, character varying, text, character varying); Type: PROCEDURE; Schema: public; Owner: usuario_taller
--

CREATE PROCEDURE public.pa_registrar_cliente(IN p_cedula character varying, IN p_nombre character varying, IN p_telefono character varying, IN p_direccion text, IN p_email character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO Cliente (cedula, nombre, telefono, direccion, email)
    VALUES (p_cedula, p_nombre, p_telefono, p_direccion, p_email);
END;
$$;


ALTER PROCEDURE public.pa_registrar_cliente(IN p_cedula character varying, IN p_nombre character varying, IN p_telefono character varying, IN p_direccion text, IN p_email character varying) OWNER TO usuario_taller;

--
-- Name: pa_registrar_compra(integer, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: usuario_taller
--

CREATE PROCEDURE public.pa_registrar_compra(IN p_id_proveedor integer, IN p_factura character varying, IN p_metodo character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO Compra (id_proveedor, numero_factura, subtotal, impuesto, total, metodo_pago)
    VALUES (p_id_proveedor, p_factura, 0, 0, 0, p_metodo);
END;
$$;


ALTER PROCEDURE public.pa_registrar_compra(IN p_id_proveedor integer, IN p_factura character varying, IN p_metodo character varying) OWNER TO usuario_taller;

--
-- Name: pa_registrar_motocicleta(integer, character varying, character varying, character varying, integer, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: usuario_taller
--

CREATE PROCEDURE public.pa_registrar_motocicleta(IN p_id_cliente integer, IN p_placa character varying, IN p_marca character varying, IN p_modelo character varying, IN p_anio integer, IN p_cilindraje character varying, IN p_color character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO Motocicleta (id_cliente, placa, marca, modelo, anio, cilindraje, color)
    VALUES (p_id_cliente, p_placa, p_marca, p_modelo, p_anio, p_cilindraje, p_color);
END;
$$;


ALTER PROCEDURE public.pa_registrar_motocicleta(IN p_id_cliente integer, IN p_placa character varying, IN p_marca character varying, IN p_modelo character varying, IN p_anio integer, IN p_cilindraje character varying, IN p_color character varying) OWNER TO usuario_taller;

--
-- Name: tf_auditoria_bitacora_orden(); Type: FUNCTION; Schema: public; Owner: usuario_taller
--

CREATE FUNCTION public.tf_auditoria_bitacora_orden() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_nombre_mecanico VARCHAR;
BEGIN
    -- Obtenemos el nombre del usuario/mec??nico que est?? en la orden
    SELECT nombre INTO v_nombre_mecanico FROM Usuario WHERE codigo = NEW.id_mecanico;

    -- Si es una orden nueva (INSERT)
    IF TG_OP = 'INSERT' THEN
        INSERT INTO Bitacora (id_usuario, accion, descripcion)
        VALUES (NEW.id_mecanico, 'CREACI??N', v_nombre_mecanico || ' registr?? una nueva Orden de Trabajo (Cod: ' || NEW.codigo || ')');
    
    -- Si cambiaron el estado de la orden (UPDATE)
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.estado IS DISTINCT FROM NEW.estado THEN
            INSERT INTO Bitacora (id_usuario, accion, descripcion)
            VALUES (NEW.id_mecanico, 'ACTUALIZACI??N', v_nombre_mecanico || ' cambi?? el estado de la Orden ' || NEW.codigo || ' a "' || NEW.estado || '"');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.tf_auditoria_bitacora_orden() OWNER TO usuario_taller;

--
-- Name: tf_auditoria_estado_orden(); Type: FUNCTION; Schema: public; Owner: usuario_taller
--

CREATE FUNCTION public.tf_auditoria_estado_orden() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.estado != OLD.estado THEN
        -- Inserta una nota a nombre del sistema (Mecanico 1 por defecto)
        INSERT INTO NotaTrabajo (id_orden_trabajo, id_mecanico, contenido, tipo_nota)
        VALUES (NEW.codigo, COALESCE(NEW.id_mecanico, 1), 'Cambio de estado autom??tico de ' || OLD.estado || ' a ' || NEW.estado, 'Sistema');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.tf_auditoria_estado_orden() OWNER TO usuario_taller;

--
-- Name: tf_aumentar_stock(); Type: FUNCTION; Schema: public; Owner: usuario_taller
--

CREATE FUNCTION public.tf_aumentar_stock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Producto SET stock_actual = stock_actual + NEW.cantidad WHERE codigo = NEW.id_producto;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.tf_aumentar_stock() OWNER TO usuario_taller;

--
-- Name: tf_disminuir_stock(); Type: FUNCTION; Schema: public; Owner: usuario_taller
--

CREATE FUNCTION public.tf_disminuir_stock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.tipo = 'Repuesto' AND NEW.provisto_por_cliente = FALSE AND NEW.id_producto IS NOT NULL THEN
        UPDATE Producto SET stock_actual = stock_actual - NEW.cantidad WHERE codigo = NEW.id_producto;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.tf_disminuir_stock() OWNER TO usuario_taller;

--
-- Name: tf_generar_factura_legal(); Type: FUNCTION; Schema: public; Owner: usuario_taller
--

CREATE FUNCTION public.tf_generar_factura_legal() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE v_cliente RECORD;
BEGIN
    SELECT cedula, nombre INTO v_cliente FROM Cliente WHERE codigo = NEW.id_cliente;
    
    INSERT INTO Factura (id_nota_servicio, numero_autorizacion, monto_servicio_facturado, impuesto, total_facturado, nit_cliente, razon_social)
    VALUES (
        NEW.codigo, 
        'AUT-' || floor(random() * 1000000)::text, 
        NEW.total_mano_obra,  -- Solo cobra mano de obra para impuestos
        NEW.total_mano_obra * 0.13, 
        NEW.total_mano_obra * 1.13, 
        v_cliente.cedula, 
        v_cliente.nombre
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.tf_generar_factura_legal() OWNER TO usuario_taller;

--
-- Name: tf_precio_cero_cliente(); Type: FUNCTION; Schema: public; Owner: usuario_taller
--

CREATE FUNCTION public.tf_precio_cero_cliente() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.provisto_por_cliente = TRUE THEN
        NEW.precio_unitario := 0;
        NEW.subtotal := 0;
    ELSE
        NEW.subtotal := NEW.cantidad * NEW.precio_unitario;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.tf_precio_cero_cliente() OWNER TO usuario_taller;

--
-- Name: tf_totales_compra(); Type: FUNCTION; Schema: public; Owner: usuario_taller
--

CREATE FUNCTION public.tf_totales_compra() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_compra INTEGER;
BEGIN
    v_id_compra := COALESCE(NEW.id_compra, OLD.id_compra);

    UPDATE Compra 
    SET subtotal = (SELECT COALESCE(SUM(subtotal),0) FROM DetalleCompra WHERE id_compra = v_id_compra),
        impuesto = (SELECT COALESCE(SUM(subtotal),0) * 0.13 FROM DetalleCompra WHERE id_compra = v_id_compra),
        total = (SELECT COALESCE(SUM(subtotal),0) * 1.13 FROM DetalleCompra WHERE id_compra = v_id_compra)
    WHERE codigo = v_id_compra;

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.tf_totales_compra() OWNER TO usuario_taller;

--
-- Name: tf_totales_cotizacion(); Type: FUNCTION; Schema: public; Owner: usuario_taller
--

CREATE FUNCTION public.tf_totales_cotizacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_cotizacion INTEGER;
BEGIN
    v_id_cotizacion := COALESCE(NEW.id_cotizacion, OLD.id_cotizacion);

    UPDATE Cotizacion 
    SET subtotal = (SELECT COALESCE(SUM(subtotal),0) FROM DetalleCotizacion WHERE id_cotizacion = v_id_cotizacion),
        total = (SELECT COALESCE(SUM(subtotal),0) FROM DetalleCotizacion WHERE id_cotizacion = v_id_cotizacion)
    WHERE codigo = v_id_cotizacion;

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.tf_totales_cotizacion() OWNER TO usuario_taller;

--
-- Name: tf_totales_orden(); Type: FUNCTION; Schema: public; Owner: usuario_taller
--

CREATE FUNCTION public.tf_totales_orden() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_orden_trabajo INTEGER;
BEGIN
    v_id_orden_trabajo := COALESCE(NEW.id_orden_trabajo, OLD.id_orden_trabajo);

    UPDATE OrdenTrabajo 
    SET costo_repuestos = (SELECT COALESCE(SUM(subtotal),0) FROM DetalleOrdenTrabajo WHERE id_orden_trabajo = v_id_orden_trabajo AND tipo = 'Repuesto'),
        costo_mano_obra = (SELECT COALESCE(SUM(subtotal),0) FROM DetalleOrdenTrabajo WHERE id_orden_trabajo = v_id_orden_trabajo AND tipo = 'Mano de Obra'),
        total = (SELECT COALESCE(SUM(subtotal),0) FROM DetalleOrdenTrabajo WHERE id_orden_trabajo = v_id_orden_trabajo)
    WHERE codigo = v_id_orden_trabajo;

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.tf_totales_orden() OWNER TO usuario_taller;

--
-- Name: tf_verificar_caducidad(); Type: FUNCTION; Schema: public; Owner: usuario_taller
--

CREATE FUNCTION public.tf_verificar_caducidad() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.estado = 'Aprobada' AND OLD.estado != 'Aprobada' THEN
        IF NEW.fecha_validez < CURRENT_DATE THEN
            RAISE EXCEPTION 'ERROR: No se puede aprobar esta cotizaci??n porque ya han pasado los 7 d??as de validez.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.tf_verificar_caducidad() OWNER TO usuario_taller;

--
-- Name: tf_verificar_stock(); Type: FUNCTION; Schema: public; Owner: usuario_taller
--

CREATE FUNCTION public.tf_verificar_stock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE v_stock INTEGER;
BEGIN
    IF NEW.tipo = 'Repuesto' AND NEW.provisto_por_cliente = FALSE AND NEW.id_producto IS NOT NULL THEN
        SELECT stock_actual INTO v_stock FROM Producto WHERE codigo = NEW.id_producto;
        IF v_stock < NEW.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para el repuesto seleccionado.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.tf_verificar_stock() OWNER TO usuario_taller;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO usuario_taller;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO usuario_taller;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO usuario_taller;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.auth_user OWNER TO usuario_taller;

--
-- Name: auth_user_groups; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_user_groups OWNER TO usuario_taller;

--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

ALTER TABLE public.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

ALTER TABLE public.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_user_permissions; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_user_user_permissions OWNER TO usuario_taller;

--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

ALTER TABLE public.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: bitacora; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.bitacora (
    codigo integer NOT NULL,
    id_usuario integer NOT NULL,
    fecha_hora timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    accion character varying(50) NOT NULL,
    descripcion text NOT NULL
);


ALTER TABLE public.bitacora OWNER TO usuario_taller;

--
-- Name: bitacora_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.bitacora_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bitacora_codigo_seq OWNER TO usuario_taller;

--
-- Name: bitacora_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.bitacora_codigo_seq OWNED BY public.bitacora.codigo;


--
-- Name: cliente; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.cliente (
    codigo integer NOT NULL,
    cedula character varying(20) NOT NULL,
    nombre character varying(150) NOT NULL,
    telefono character varying(20),
    telefono_alternativo character varying(20),
    direccion text,
    email character varying(100),
    fecha_registro date DEFAULT CURRENT_DATE,
    estado character varying(20) DEFAULT 'Activo'::character varying
);


ALTER TABLE public.cliente OWNER TO usuario_taller;

--
-- Name: cliente_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.cliente_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cliente_codigo_seq OWNER TO usuario_taller;

--
-- Name: cliente_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.cliente_codigo_seq OWNED BY public.cliente.codigo;


--
-- Name: compra; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.compra (
    codigo integer NOT NULL,
    id_proveedor integer NOT NULL,
    numero_factura character varying(50),
    fecha date DEFAULT CURRENT_DATE,
    subtotal numeric(10,2) NOT NULL,
    impuesto numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    metodo_pago character varying(50),
    estado character varying(20) DEFAULT 'Completada'::character varying
);


ALTER TABLE public.compra OWNER TO usuario_taller;

--
-- Name: compra_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.compra_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.compra_codigo_seq OWNER TO usuario_taller;

--
-- Name: compra_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.compra_codigo_seq OWNED BY public.compra.codigo;


--
-- Name: cotizacion; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.cotizacion (
    codigo integer NOT NULL,
    id_cliente integer NOT NULL,
    id_motocicleta integer NOT NULL,
    fecha_emision date DEFAULT CURRENT_DATE,
    fecha_validez date NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    impuesto numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    estado character varying(20) DEFAULT 'Pendiente'::character varying
);


ALTER TABLE public.cotizacion OWNER TO usuario_taller;

--
-- Name: cotizacion_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.cotizacion_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cotizacion_codigo_seq OWNER TO usuario_taller;

--
-- Name: cotizacion_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.cotizacion_codigo_seq OWNED BY public.cotizacion.codigo;


--
-- Name: detallecompra; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.detallecompra (
    codigo integer NOT NULL,
    id_compra integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad integer NOT NULL,
    precio_compra numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL
);


ALTER TABLE public.detallecompra OWNER TO usuario_taller;

--
-- Name: detallecompra_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.detallecompra_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.detallecompra_codigo_seq OWNER TO usuario_taller;

--
-- Name: detallecompra_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.detallecompra_codigo_seq OWNED BY public.detallecompra.codigo;


--
-- Name: detallecotizacion; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.detallecotizacion (
    codigo integer NOT NULL,
    id_cotizacion integer NOT NULL,
    tipo character varying(50) NOT NULL,
    descripcion text,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL
);


ALTER TABLE public.detallecotizacion OWNER TO usuario_taller;

--
-- Name: detallecotizacion_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.detallecotizacion_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.detallecotizacion_codigo_seq OWNER TO usuario_taller;

--
-- Name: detallecotizacion_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.detallecotizacion_codigo_seq OWNED BY public.detallecotizacion.codigo;


--
-- Name: detalleordentrabajo; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.detalleordentrabajo (
    codigo integer NOT NULL,
    id_orden_trabajo integer NOT NULL,
    id_producto integer,
    tipo character varying(50) NOT NULL,
    descripcion text,
    cantidad integer NOT NULL,
    provisto_por_cliente boolean DEFAULT false,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL
);


ALTER TABLE public.detalleordentrabajo OWNER TO usuario_taller;

--
-- Name: detalleordentrabajo_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.detalleordentrabajo_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.detalleordentrabajo_codigo_seq OWNER TO usuario_taller;

--
-- Name: detalleordentrabajo_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.detalleordentrabajo_codigo_seq OWNED BY public.detalleordentrabajo.codigo;


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO usuario_taller;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO usuario_taller;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO usuario_taller;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO usuario_taller;

--
-- Name: factura; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.factura (
    codigo integer NOT NULL,
    id_nota_servicio integer NOT NULL,
    numero_autorizacion character varying(100),
    fecha_emision date DEFAULT CURRENT_DATE,
    monto_servicio_facturado numeric(10,2) NOT NULL,
    impuesto numeric(10,2) NOT NULL,
    total_facturado numeric(10,2) NOT NULL,
    nit_cliente character varying(30) NOT NULL,
    razon_social character varying(150) NOT NULL,
    metodo_pago character varying(50),
    comprobante_pago character varying(255)
);


ALTER TABLE public.factura OWNER TO usuario_taller;

--
-- Name: factura_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.factura_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.factura_codigo_seq OWNER TO usuario_taller;

--
-- Name: factura_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.factura_codigo_seq OWNED BY public.factura.codigo;


--
-- Name: motocicleta; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.motocicleta (
    codigo integer NOT NULL,
    id_cliente integer NOT NULL,
    placa character varying(15) NOT NULL,
    marca character varying(50),
    modelo character varying(50),
    anio integer,
    cilindraje character varying(20),
    color character varying(30),
    numero_motor character varying(100),
    numero_chasis character varying(100),
    kilometraje_actual numeric(10,2) DEFAULT 0,
    estado character varying(20) DEFAULT 'Activo'::character varying
);


ALTER TABLE public.motocicleta OWNER TO usuario_taller;

--
-- Name: motocicleta_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.motocicleta_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.motocicleta_codigo_seq OWNER TO usuario_taller;

--
-- Name: motocicleta_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.motocicleta_codigo_seq OWNED BY public.motocicleta.codigo;


--
-- Name: notaservicio; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.notaservicio (
    codigo integer NOT NULL,
    id_orden_trabajo integer NOT NULL,
    id_cliente integer NOT NULL,
    fecha_emision date DEFAULT CURRENT_DATE,
    total_repuestos numeric(10,2) NOT NULL,
    total_mano_obra numeric(10,2) NOT NULL,
    total_general numeric(10,2) NOT NULL,
    observaciones text,
    estado_pago character varying(20) DEFAULT 'Pendiente'::character varying
);


ALTER TABLE public.notaservicio OWNER TO usuario_taller;

--
-- Name: notaservicio_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.notaservicio_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notaservicio_codigo_seq OWNER TO usuario_taller;

--
-- Name: notaservicio_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.notaservicio_codigo_seq OWNED BY public.notaservicio.codigo;


--
-- Name: notatrabajo; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.notatrabajo (
    codigo integer NOT NULL,
    id_orden_trabajo integer NOT NULL,
    id_mecanico integer NOT NULL,
    fecha_hora timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    contenido text NOT NULL,
    tipo_nota character varying(50)
);


ALTER TABLE public.notatrabajo OWNER TO usuario_taller;

--
-- Name: notatrabajo_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.notatrabajo_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notatrabajo_codigo_seq OWNER TO usuario_taller;

--
-- Name: notatrabajo_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.notatrabajo_codigo_seq OWNED BY public.notatrabajo.codigo;


--
-- Name: ordentrabajo; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.ordentrabajo (
    codigo integer NOT NULL,
    id_cotizacion integer,
    id_cliente integer NOT NULL,
    id_motocicleta integer NOT NULL,
    id_mecanico integer,
    fecha_creacion date DEFAULT CURRENT_DATE,
    fecha_inicio date,
    fecha_fin date,
    kilometraje_ingreso numeric(10,2),
    estado character varying(30) DEFAULT 'En revisi??n'::character varying,
    prioridad character varying(20) DEFAULT 'Normal'::character varying,
    costo_mano_obra numeric(10,2) DEFAULT 0,
    costo_repuestos numeric(10,2) DEFAULT 0,
    total numeric(10,2) DEFAULT 0
);


ALTER TABLE public.ordentrabajo OWNER TO usuario_taller;

--
-- Name: ordentrabajo_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.ordentrabajo_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ordentrabajo_codigo_seq OWNER TO usuario_taller;

--
-- Name: ordentrabajo_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.ordentrabajo_codigo_seq OWNED BY public.ordentrabajo.codigo;


--
-- Name: permiso_modulo; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.permiso_modulo (
    id integer NOT NULL,
    id_rol integer NOT NULL,
    codigo_cu character varying(20) NOT NULL,
    nombre_modulo character varying(255) NOT NULL,
    accion character varying(50) NOT NULL,
    permitido boolean DEFAULT true NOT NULL
);


ALTER TABLE public.permiso_modulo OWNER TO usuario_taller;

--
-- Name: permiso_modulo_id_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.permiso_modulo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.permiso_modulo_id_seq OWNER TO usuario_taller;

--
-- Name: permiso_modulo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.permiso_modulo_id_seq OWNED BY public.permiso_modulo.id;


--
-- Name: privilegio; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.privilegio (
    codigo integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);


ALTER TABLE public.privilegio OWNER TO usuario_taller;

--
-- Name: privilegio_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.privilegio_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.privilegio_codigo_seq OWNER TO usuario_taller;

--
-- Name: privilegio_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.privilegio_codigo_seq OWNED BY public.privilegio.codigo;


--
-- Name: producto; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.producto (
    codigo integer NOT NULL,
    codigo_barras character varying(50),
    nombre character varying(150) NOT NULL,
    categoria character varying(50),
    marca character varying(50),
    modelo_compatible text,
    stock_actual integer DEFAULT 0,
    stock_minimo integer DEFAULT 0,
    precio_compra numeric(10,2) NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    ubicacion_almacen character varying(50),
    estado character varying(20) DEFAULT 'Activo'::character varying
);


ALTER TABLE public.producto OWNER TO usuario_taller;

--
-- Name: producto_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.producto_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.producto_codigo_seq OWNER TO usuario_taller;

--
-- Name: producto_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.producto_codigo_seq OWNED BY public.producto.codigo;


--
-- Name: proveedor; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.proveedor (
    codigo integer NOT NULL,
    empresa character varying(150) NOT NULL,
    nit character varying(30) NOT NULL,
    contacto character varying(100),
    telefono character varying(20),
    email character varying(100),
    direccion text
);


ALTER TABLE public.proveedor OWNER TO usuario_taller;

--
-- Name: proveedor_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.proveedor_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.proveedor_codigo_seq OWNER TO usuario_taller;

--
-- Name: proveedor_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.proveedor_codigo_seq OWNED BY public.proveedor.codigo;


--
-- Name: rol; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.rol (
    codigo integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);


ALTER TABLE public.rol OWNER TO usuario_taller;

--
-- Name: rol_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.rol_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rol_codigo_seq OWNER TO usuario_taller;

--
-- Name: rol_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.rol_codigo_seq OWNED BY public.rol.codigo;


--
-- Name: rol_privilegio; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.rol_privilegio (
    id_rol integer NOT NULL,
    id_privilegio integer NOT NULL
);


ALTER TABLE public.rol_privilegio OWNER TO usuario_taller;

--
-- Name: seguimiento; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.seguimiento (
    codigo integer NOT NULL,
    fecha_hora timestamp with time zone NOT NULL,
    tipo_gestion character varying(50) NOT NULL,
    canal character varying(50) NOT NULL,
    mensaje text NOT NULL,
    observaciones text,
    id_cliente integer NOT NULL,
    id_usuario integer NOT NULL
);


ALTER TABLE public.seguimiento OWNER TO usuario_taller;

--
-- Name: seguimiento_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

ALTER TABLE public.seguimiento ALTER COLUMN codigo ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.seguimiento_codigo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: usuario_taller
--

CREATE TABLE public.usuario (
    codigo integer NOT NULL,
    id_rol integer NOT NULL,
    nombre character varying(150) NOT NULL,
    email character varying(100) NOT NULL,
    contrasena character varying(255) NOT NULL,
    telefono character varying(20),
    estado character varying(20) DEFAULT 'Activo'::character varying,
    fecha_registro date DEFAULT CURRENT_DATE
);


ALTER TABLE public.usuario OWNER TO usuario_taller;

--
-- Name: usuario_codigo_seq; Type: SEQUENCE; Schema: public; Owner: usuario_taller
--

CREATE SEQUENCE public.usuario_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.usuario_codigo_seq OWNER TO usuario_taller;

--
-- Name: usuario_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usuario_taller
--

ALTER SEQUENCE public.usuario_codigo_seq OWNED BY public.usuario.codigo;


--
-- Name: bitacora codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.bitacora ALTER COLUMN codigo SET DEFAULT nextval('public.bitacora_codigo_seq'::regclass);


--
-- Name: cliente codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.cliente ALTER COLUMN codigo SET DEFAULT nextval('public.cliente_codigo_seq'::regclass);


--
-- Name: compra codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.compra ALTER COLUMN codigo SET DEFAULT nextval('public.compra_codigo_seq'::regclass);


--
-- Name: cotizacion codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.cotizacion ALTER COLUMN codigo SET DEFAULT nextval('public.cotizacion_codigo_seq'::regclass);


--
-- Name: detallecompra codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.detallecompra ALTER COLUMN codigo SET DEFAULT nextval('public.detallecompra_codigo_seq'::regclass);


--
-- Name: detallecotizacion codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.detallecotizacion ALTER COLUMN codigo SET DEFAULT nextval('public.detallecotizacion_codigo_seq'::regclass);


--
-- Name: detalleordentrabajo codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.detalleordentrabajo ALTER COLUMN codigo SET DEFAULT nextval('public.detalleordentrabajo_codigo_seq'::regclass);


--
-- Name: factura codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.factura ALTER COLUMN codigo SET DEFAULT nextval('public.factura_codigo_seq'::regclass);


--
-- Name: motocicleta codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.motocicleta ALTER COLUMN codigo SET DEFAULT nextval('public.motocicleta_codigo_seq'::regclass);


--
-- Name: notaservicio codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.notaservicio ALTER COLUMN codigo SET DEFAULT nextval('public.notaservicio_codigo_seq'::regclass);


--
-- Name: notatrabajo codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.notatrabajo ALTER COLUMN codigo SET DEFAULT nextval('public.notatrabajo_codigo_seq'::regclass);


--
-- Name: ordentrabajo codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.ordentrabajo ALTER COLUMN codigo SET DEFAULT nextval('public.ordentrabajo_codigo_seq'::regclass);


--
-- Name: permiso_modulo id; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.permiso_modulo ALTER COLUMN id SET DEFAULT nextval('public.permiso_modulo_id_seq'::regclass);


--
-- Name: privilegio codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.privilegio ALTER COLUMN codigo SET DEFAULT nextval('public.privilegio_codigo_seq'::regclass);


--
-- Name: producto codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.producto ALTER COLUMN codigo SET DEFAULT nextval('public.producto_codigo_seq'::regclass);


--
-- Name: proveedor codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.proveedor ALTER COLUMN codigo SET DEFAULT nextval('public.proveedor_codigo_seq'::regclass);


--
-- Name: rol codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.rol ALTER COLUMN codigo SET DEFAULT nextval('public.rol_codigo_seq'::regclass);


--
-- Name: usuario codigo; Type: DEFAULT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.usuario ALTER COLUMN codigo SET DEFAULT nextval('public.usuario_codigo_seq'::regclass);


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.auth_group (id, name) FROM stdin;
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
1	Can add log entry	1	add_logentry
2	Can change log entry	1	change_logentry
3	Can delete log entry	1	delete_logentry
4	Can view log entry	1	view_logentry
5	Can add permission	2	add_permission
6	Can change permission	2	change_permission
7	Can delete permission	2	delete_permission
8	Can view permission	2	view_permission
9	Can add group	3	add_group
10	Can change group	3	change_group
11	Can delete group	3	delete_group
12	Can view group	3	view_group
13	Can add user	4	add_user
14	Can change user	4	change_user
15	Can delete user	4	delete_user
16	Can view user	4	view_user
17	Can add content type	5	add_contenttype
18	Can change content type	5	change_contenttype
19	Can delete content type	5	delete_contenttype
20	Can view content type	5	view_contenttype
21	Can add session	6	add_session
22	Can change session	6	change_session
23	Can delete session	6	delete_session
24	Can view session	6	view_session
25	Can add auth group	7	add_authgroup
26	Can change auth group	7	change_authgroup
27	Can delete auth group	7	delete_authgroup
28	Can view auth group	7	view_authgroup
29	Can add auth group permissions	8	add_authgrouppermissions
30	Can change auth group permissions	8	change_authgrouppermissions
31	Can delete auth group permissions	8	delete_authgrouppermissions
32	Can view auth group permissions	8	view_authgrouppermissions
33	Can add auth permission	9	add_authpermission
34	Can change auth permission	9	change_authpermission
35	Can delete auth permission	9	delete_authpermission
36	Can view auth permission	9	view_authpermission
37	Can add auth user	10	add_authuser
38	Can change auth user	10	change_authuser
39	Can delete auth user	10	delete_authuser
40	Can view auth user	10	view_authuser
41	Can add auth user groups	11	add_authusergroups
42	Can change auth user groups	11	change_authusergroups
43	Can delete auth user groups	11	delete_authusergroups
44	Can view auth user groups	11	view_authusergroups
45	Can add auth user user permissions	12	add_authuseruserpermissions
46	Can change auth user user permissions	12	change_authuseruserpermissions
47	Can delete auth user user permissions	12	delete_authuseruserpermissions
48	Can view auth user user permissions	12	view_authuseruserpermissions
49	Can add bitacora	13	add_bitacora
50	Can change bitacora	13	change_bitacora
51	Can delete bitacora	13	delete_bitacora
52	Can view bitacora	13	view_bitacora
53	Can add cliente	14	add_cliente
54	Can change cliente	14	change_cliente
55	Can delete cliente	14	delete_cliente
56	Can view cliente	14	view_cliente
57	Can add compra	15	add_compra
58	Can change compra	15	change_compra
59	Can delete compra	15	delete_compra
60	Can view compra	15	view_compra
61	Can add cotizacion	16	add_cotizacion
62	Can change cotizacion	16	change_cotizacion
63	Can delete cotizacion	16	delete_cotizacion
64	Can view cotizacion	16	view_cotizacion
65	Can add detallecompra	17	add_detallecompra
66	Can change detallecompra	17	change_detallecompra
67	Can delete detallecompra	17	delete_detallecompra
68	Can view detallecompra	17	view_detallecompra
69	Can add detallecotizacion	18	add_detallecotizacion
70	Can change detallecotizacion	18	change_detallecotizacion
71	Can delete detallecotizacion	18	delete_detallecotizacion
72	Can view detallecotizacion	18	view_detallecotizacion
73	Can add detalleordentrabajo	19	add_detalleordentrabajo
74	Can change detalleordentrabajo	19	change_detalleordentrabajo
75	Can delete detalleordentrabajo	19	delete_detalleordentrabajo
76	Can view detalleordentrabajo	19	view_detalleordentrabajo
77	Can add django admin log	20	add_djangoadminlog
78	Can change django admin log	20	change_djangoadminlog
79	Can delete django admin log	20	delete_djangoadminlog
80	Can view django admin log	20	view_djangoadminlog
81	Can add django content type	21	add_djangocontenttype
82	Can change django content type	21	change_djangocontenttype
83	Can delete django content type	21	delete_djangocontenttype
84	Can view django content type	21	view_djangocontenttype
85	Can add django migrations	22	add_djangomigrations
86	Can change django migrations	22	change_djangomigrations
87	Can delete django migrations	22	delete_djangomigrations
88	Can view django migrations	22	view_djangomigrations
89	Can add django session	23	add_djangosession
90	Can change django session	23	change_djangosession
91	Can delete django session	23	delete_djangosession
92	Can view django session	23	view_djangosession
93	Can add factura	24	add_factura
94	Can change factura	24	change_factura
95	Can delete factura	24	delete_factura
96	Can view factura	24	view_factura
97	Can add motocicleta	25	add_motocicleta
98	Can change motocicleta	25	change_motocicleta
99	Can delete motocicleta	25	delete_motocicleta
100	Can view motocicleta	25	view_motocicleta
101	Can add notaservicio	26	add_notaservicio
102	Can change notaservicio	26	change_notaservicio
103	Can delete notaservicio	26	delete_notaservicio
104	Can view notaservicio	26	view_notaservicio
105	Can add notatrabajo	27	add_notatrabajo
106	Can change notatrabajo	27	change_notatrabajo
107	Can delete notatrabajo	27	delete_notatrabajo
108	Can view notatrabajo	27	view_notatrabajo
109	Can add ordentrabajo	28	add_ordentrabajo
110	Can change ordentrabajo	28	change_ordentrabajo
111	Can delete ordentrabajo	28	delete_ordentrabajo
112	Can view ordentrabajo	28	view_ordentrabajo
113	Can add privilegio	29	add_privilegio
114	Can change privilegio	29	change_privilegio
115	Can delete privilegio	29	delete_privilegio
116	Can view privilegio	29	view_privilegio
117	Can add producto	30	add_producto
118	Can change producto	30	change_producto
119	Can delete producto	30	delete_producto
120	Can view producto	30	view_producto
121	Can add proveedor	31	add_proveedor
122	Can change proveedor	31	change_proveedor
123	Can delete proveedor	31	delete_proveedor
124	Can view proveedor	31	view_proveedor
125	Can add rol	32	add_rol
126	Can change rol	32	change_rol
127	Can delete rol	32	delete_rol
128	Can view rol	32	view_rol
129	Can add rol privilegio	33	add_rolprivilegio
130	Can change rol privilegio	33	change_rolprivilegio
131	Can delete rol privilegio	33	delete_rolprivilegio
132	Can view rol privilegio	33	view_rolprivilegio
133	Can add usuario	34	add_usuario
134	Can change usuario	34	change_usuario
135	Can delete usuario	34	delete_usuario
136	Can view usuario	34	view_usuario
137	Can add permiso modulo	35	add_permisomodulo
138	Can change permiso modulo	35	change_permisomodulo
139	Can delete permiso modulo	35	delete_permisomodulo
140	Can view permiso modulo	35	view_permisomodulo
141	Can add seguimiento	36	add_seguimiento
142	Can change seguimiento	36	change_seguimiento
143	Can delete seguimiento	36	delete_seguimiento
144	Can view seguimiento	36	view_seguimiento
\.


--
-- Data for Name: auth_user; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.auth_user (id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined) FROM stdin;
\.


--
-- Data for Name: auth_user_groups; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.auth_user_groups (id, user_id, group_id) FROM stdin;
\.


--
-- Data for Name: auth_user_user_permissions; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.auth_user_user_permissions (id, user_id, permission_id) FROM stdin;
\.


--
-- Data for Name: bitacora; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.bitacora (codigo, id_usuario, fecha_hora, accion, descripcion) FROM stdin;
1	2	2026-04-13 05:30:28.791839	ACTUALIZACI??N	Maria (Recepcionista) cambi?? el estado de la Orden 3 a "Finalizado"
8	1	2026-04-13 08:29:38.134014	CREACI??N	Registr?? al nuevo usuario: Usuario Auditoria con el rol Mec??nico.
2	1	2026-04-13 08:29:58.434126	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
3	1	2026-04-13 08:29:58.434126	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
4	1	2026-04-13 08:29:58.434126	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
5	1	2026-04-13 08:29:58.434126	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
6	4	2026-04-13 08:29:58.434126	LOGIN	El usuario Clark Kent (Mec??nico) inici?? sesi??n en el sistema.
7	4	2026-04-13 08:29:58.434126	LOGOUT	El usuario Clark Kent (Mec??nico) cerr?? su sesi??n.
9	1	2026-04-13 08:40:08.811627	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
10	3	2026-04-13 08:40:19.865747	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
11	3	2026-04-13 08:40:33.670073	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
12	1	2026-04-13 08:46:17.107769	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
13	1	2026-04-13 08:55:07.800083	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
14	1	2026-04-13 15:19:52.890348	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
15	1	2026-04-13 15:21:09.504179	CREACI??N	Registr?? al nuevo usuario: Lisa con el rol Cliente.
16	1	2026-04-13 15:21:43.624161	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
17	1	2026-04-13 19:02:17.641852	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
18	1	2026-04-13 19:02:17.905858	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
19	1	2026-04-13 19:10:42.433716	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
20	1	2026-04-13 19:14:52.784828	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
21	1	2026-04-13 19:19:25.127221	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
22	1	2026-04-13 19:20:13.258969	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
23	1	2026-04-13 19:20:13.696864	CREACI??N	Registr?? al nuevo usuario: Recep Smoke 20260413152012 con el rol Recepcionista.
24	9	2026-04-13 19:20:13.975609	LOGIN	El usuario Recep Smoke 20260413152012 inici?? sesi??n en el sistema.
25	9	2026-04-13 19:20:14.130198	MODIFICACI??N	Actualiz?? su informaci??n de perfil.
26	9	2026-04-13 19:20:14.740736	MODIFICACI??N	Actualiz?? su contrase??a de acceso.
27	9	2026-04-13 19:20:15.055307	LOGIN	El usuario Recep Smoke Edit 20260413152012 inici?? sesi??n en el sistema.
28	1	2026-04-13 19:20:15.128019	CREACI??N	Registr?? cliente: Cliente Smoke 20260413152012 (SMK-20260413152012).
29	1	2026-04-13 19:20:15.300488	CREACI??N	Registr?? motocicleta placa SMK152012 para cliente ID 5.
30	1	2026-04-13 19:20:15.449384	ELIMINACI??N	Elimin?? motocicleta placa SMK152012.
31	1	2026-04-13 19:20:15.52312	ELIMINACI??N	Elimin?? cliente: Cliente Smoke 20260413152012.
32	1	2026-04-13 19:20:30.274128	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
33	1	2026-04-13 19:21:23.458652	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
34	1	2026-04-13 19:25:02.876023	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
35	1	2026-04-13 19:26:49.714017	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
36	1	2026-04-13 19:26:59.954753	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
37	1	2026-04-13 19:27:06.757568	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
38	1	2026-04-13 19:40:17.551128	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
39	1	2026-04-13 19:40:17.668367	MODIFICACI??N	Actualiz?? el rol: Administrador_EDIT_4017.
40	1	2026-04-13 19:41:12.73042	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
41	1	2026-04-13 19:41:12.867294	MODIFICACI??N	Actualiz?? el rol: Recepcionista.
42	1	2026-04-13 19:41:13.02884	MODIFICACI??N	Actualiz?? el privilegio: Gestionar Usuarios.
43	1	2026-04-13 19:41:13.149575	MODIFICACI??N	Actualiz?? usuario Maria (Recepcionista) (estado: Inactivo, rol: Recepcionista).
44	1	2026-04-13 19:41:13.246395	MODIFICACI??N	Actualiz?? usuario Maria (Recepcionista) (estado: Activo, rol: Recepcionista).
45	1	2026-04-13 19:41:32.949446	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
46	1	2026-04-13 19:53:58.242692	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
47	1	2026-04-13 19:53:58.271527	SOLICITUD_RESET	Solicit?? recuperaci??n de contrase??a por correo.
48	1	2026-04-13 19:53:58.624485	CREACI??N	Registr?? al nuevo usuario: Cliente Prueba Temporal con el rol Mec??nico.
52	1	2026-04-13 19:54:00.9255	RESET_PASSWORD	Restableci?? su contrase??a mediante enlace de recuperaci??n.
53	1	2026-04-13 19:54:01.29143	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
54	1	2026-04-13 19:54:27.564128	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
55	1	2026-04-13 19:54:27.590657	CREACI??N	Registr?? cliente: Maria Lopez (COT-20260413155427).
56	1	2026-04-13 19:54:27.746281	CREACI??N	Registr?? motocicleta placa MC155427 para cliente ID 6.
57	1	2026-04-13 19:54:29.048144	CREACI??N	Gener?? usuario cliente 'marialopez' al aceptar cotizaci??n 4.
58	1	2026-04-13 19:54:29.0514	MODIFICACI??N	Aprob?? cotizaci??n 4 del cliente Maria Lopez.
62	1	2026-04-13 19:54:45.791438	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
63	1	2026-04-13 19:54:47.042232	RESET_PASSWORD	Restableci?? su contrase??a mediante enlace de recuperaci??n.
64	1	2026-04-13 19:54:47.392909	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
65	1	2026-04-13 19:54:47.964814	MODIFICACI??N	Actualiz?? su contrase??a de acceso.
66	1	2026-04-13 20:56:27.512649	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
67	1	2026-04-13 20:56:27.928293	SOLICITUD_RESET	Solicit?? recuperaci??n de contrase??a por correo.
68	1	2026-04-13 20:56:42.07866	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
69	1	2026-04-13 20:56:42.114565	CREACI??N	Registr?? cliente: Ana Perez (COT2-20260413165642).
70	1	2026-04-13 20:56:42.37294	CREACI??N	Registr?? motocicleta placa AP165642 para cliente ID 7.
71	1	2026-04-13 20:56:44.028608	CREACI??N	Gener?? usuario cliente 'anaperez' al aceptar cotizaci??n 5.
72	1	2026-04-13 20:56:44.032076	MODIFICACI??N	Aprob?? cotizaci??n 5 del cliente Ana Perez.
73	12	2026-04-13 20:56:44.577295	LOGIN	El usuario Ana Perez inici?? sesi??n en el sistema.
74	12	2026-04-13 20:56:45.171498	MODIFICACI??N	Cambi?? su contrase??a temporal obligatoria.
75	12	2026-04-13 20:56:45.835749	LOGIN	El usuario Ana Perez inici?? sesi??n en el sistema.
76	1	2026-04-13 20:56:48.400487	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
77	1	2026-04-13 21:08:27.95289	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
78	2	2026-04-13 21:08:30.940436	LOGIN	El usuario Maria (Recepcionista) inici?? sesi??n en el sistema.
79	1	2026-04-13 21:09:11.351065	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
80	2	2026-04-13 21:09:11.641154	LOGIN	El usuario Maria (Recepcionista) inici?? sesi??n en el sistema.
81	1	2026-04-13 21:09:12.340995	CREACI??N	Cre?? el rol: rol_tmp_c1_d010dd.
82	1	2026-04-13 21:09:12.808923	CREACI??N	Cre?? el privilegio: priv_tmp_c1_68e4e5.
83	1	2026-04-13 21:09:13.684665	CREACI??N	Registr?? al nuevo usuario: Tmp C1 con el rol Recepcionista.
84	1	2026-04-13 21:09:13.98248	CREACI??N	Registr?? cliente: Cliente Tmp C1 (C1TMP897596).
85	1	2026-04-13 21:09:14.212807	MODIFICACI??N	Actualiz?? cliente: Cliente Tmp C1 Edit.
86	1	2026-04-13 21:09:14.339164	CREACI??N	Registr?? motocicleta placa C1142 para cliente ID 8.
87	1	2026-04-13 21:09:14.545221	MODIFICACI??N	Actualiz?? motocicleta placa C1142.
88	1	2026-04-13 21:09:14.573548	ELIMINACI??N	Elimin?? motocicleta placa C1142.
89	1	2026-04-13 21:09:14.674593	ELIMINACI??N	Elimin?? cliente: Cliente Tmp C1 Edit.
90	1	2026-04-13 21:09:14.888401	MODIFICACI??N	Actualiz?? su informaci??n de perfil.
91	1	2026-04-13 21:09:14.980576	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
92	1	2026-04-13 21:09:52.556104	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
93	2	2026-04-13 21:09:52.836365	LOGIN	El usuario Maria (Recepcionista) inici?? sesi??n en el sistema.
94	1	2026-04-13 21:09:53.604256	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
95	1	2026-04-13 21:37:25.792416	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
96	1	2026-04-14 06:39:45.214763	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
97	1	2026-04-14 06:47:13.828018	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
98	1	2026-04-14 06:47:46.056082	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
99	1	2026-04-14 06:49:51.134172	CREACI??N	Registr?? cliente: Alex Arg (6666668).
100	1	2026-04-14 06:50:04.528157	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
101	1	2026-04-14 06:53:22.746195	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
102	1	2026-04-14 06:53:41.896055	MODIFICACI??N	Desactiv?? cliente: Alex Arg.
103	1	2026-04-14 06:54:28.04277	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
104	1	2026-04-14 06:55:00.342958	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
105	1	2026-04-14 06:55:27.173273	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
106	5	2026-04-14 06:55:35.107271	LOGIN	El usuario Homero inici?? sesi??n en el sistema.
107	5	2026-04-14 06:56:12.066229	LOGOUT	El usuario Homero cerr?? su sesi??n.
108	1	2026-04-14 06:56:28.11386	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
109	1	2026-04-14 06:57:24.044029	ELIMINACI??N	Elimin?? el privilegio: priv_tmp_c1_68e4e5.
110	1	2026-04-14 06:57:26.828701	ELIMINACI??N	Elimin?? el rol: rol_tmp_c1_d010dd.
111	1	2026-04-14 06:57:57.332597	MODIFICACI??N	Actualiz?? usuario Tmp C1 (estado: Inactivo, rol: Recepcionista).
112	1	2026-04-14 06:58:09.823593	MODIFICACI??N	Actualiz?? usuario Recep Smoke Edit 20260413152012 (estado: Inactivo, rol: Recepcionista).
113	1	2026-04-14 07:13:48.316539	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
114	1	2026-04-14 07:18:33.289249	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
115	1	2026-04-14 07:19:12.339692	CREACI??N	Registr?? al nuevo usuario: Maria Lopez con el rol Cliente.
116	1	2026-04-14 07:19:23.279253	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
117	14	2026-04-14 07:19:36.787644	LOGIN	El usuario Maria Lopez inici?? sesi??n en el sistema.
118	14	2026-04-14 07:20:07.651308	MODIFICACI??N	Cambi?? su contrase??a temporal obligatoria.
119	14	2026-04-14 07:20:43.96908	LOGIN	El usuario Maria Lopez inici?? sesi??n en el sistema.
120	14	2026-04-14 07:21:04.83249	LOGOUT	El usuario Maria Lopez cerr?? su sesi??n.
121	1	2026-04-14 07:24:13.640527	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
122	1	2026-04-14 07:32:11.624959	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
123	14	2026-04-14 07:32:28.250524	LOGIN	El usuario Maria Lopez inici?? sesi??n en el sistema.
124	14	2026-04-14 07:33:23.969427	LOGOUT	El usuario Maria Lopez cerr?? su sesi??n.
125	14	2026-04-14 07:35:17.570497	LOGIN	El usuario Maria Lopez inici?? sesi??n en el sistema.
126	14	2026-04-14 07:42:45.998638	LOGOUT	El usuario Maria Lopez cerr?? su sesi??n.
127	14	2026-04-14 07:54:26.121356	LOGIN	El usuario Maria Lopez inici?? sesi??n en el sistema.
128	14	2026-04-14 07:54:31.932507	LOGOUT	El usuario Maria Lopez cerr?? su sesi??n.
129	1	2026-04-14 07:54:40.163246	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
130	1	2026-04-14 07:54:55.950149	MODIFICACI??N	Actualiz?? usuario Ana Perez (estado: Inactivo, rol: Cliente).
131	1	2026-04-14 07:55:08.970338	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
132	2	2026-04-14 07:55:16.878795	LOGIN	El usuario Maria (Recepcionista) inici?? sesi??n en el sistema.
133	2	2026-04-14 07:55:42.707115	LOGOUT	El usuario Maria (Recepcionista) cerr?? su sesi??n.
134	1	2026-04-14 07:55:54.049701	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
135	1	2026-04-14 07:56:10.697163	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
136	3	2026-04-14 07:56:20.576013	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
137	3	2026-04-14 07:56:24.269754	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
138	3	2026-04-14 07:56:25.016463	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
139	3	2026-04-14 07:56:25.587199	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
140	4	2026-04-14 07:56:30.033865	LOGIN	El usuario Clark Kent (Mec??nico) inici?? sesi??n en el sistema.
141	4	2026-04-14 07:56:37.514433	LOGIN	El usuario Clark Kent (Mec??nico) inici?? sesi??n en el sistema.
142	4	2026-04-14 07:56:48.947074	LOGIN	El usuario Clark Kent (Mec??nico) inici?? sesi??n en el sistema.
143	4	2026-04-14 07:56:51.927838	LOGIN	El usuario Clark Kent (Mec??nico) inici?? sesi??n en el sistema.
144	4	2026-04-14 07:56:53.750008	LOGIN	El usuario Clark Kent (Mec??nico) inici?? sesi??n en el sistema.
145	3	2026-04-14 08:00:10.458308	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
146	3	2026-04-14 08:01:03.120942	LOGOUT	El usuario Carlos (Mec??nico) cerr?? su sesi??n.
147	3	2026-04-14 08:01:13.771814	SOLICITUD_RESET	Solicit?? recuperaci??n de contrase??a por correo.
148	3	2026-04-14 08:01:48.424028	RESET_PASSWORD	Restableci?? su contrase??a mediante enlace de recuperaci??n.
149	3	2026-04-14 08:02:04.837287	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
150	3	2026-04-14 08:02:19.453302	LOGOUT	El usuario Carlos (Mec??nico) cerr?? su sesi??n.
151	3	2026-04-14 08:02:31.525808	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
152	3	2026-04-14 08:02:48.37146	MODIFICACI??N	Actualiz?? su contrase??a de acceso.
153	1	2026-04-14 08:03:06.282863	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
154	1	2026-04-14 08:03:38.237098	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
155	1	2026-04-14 13:49:48.520396	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
156	1	2026-04-14 13:50:57.340038	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
157	14	2026-04-14 13:51:10.781684	LOGIN	El usuario Maria Lopez inici?? sesi??n en el sistema.
158	14	2026-04-14 14:01:04.517262	LOGOUT	El usuario Maria Lopez cerr?? su sesi??n.
159	3	2026-04-14 14:01:16.976287	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
160	3	2026-04-14 14:01:24.447553	LOGOUT	El usuario Carlos (Mec??nico) cerr?? su sesi??n.
161	3	2026-04-14 14:24:30.669467	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
162	3	2026-04-14 14:24:32.737688	LOGOUT	El usuario Carlos (Mec??nico) cerr?? su sesi??n.
163	3	2026-04-14 14:25:17.115101	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
164	3	2026-04-14 14:25:20.971691	LOGOUT	El usuario Carlos (Mec??nico) cerr?? su sesi??n.
165	1	2026-04-14 14:25:30.775345	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
166	1	2026-04-14 14:28:00.144537	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
167	3	2026-04-14 14:29:18.592054	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
168	3	2026-04-14 14:29:21.958935	LOGOUT	El usuario Carlos (Mec??nico) cerr?? su sesi??n.
169	1	2026-04-14 14:31:34.510151	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
170	1	2026-04-14 14:31:42.879336	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
171	1	2026-04-14 14:40:26.8663	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
172	1	2026-04-14 14:40:33.926731	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
173	3	2026-04-14 14:40:44.052537	BLOQUEO_CUENTA	Cuenta bloqueada por 1 minuto tras 3 intentos fallidos de contrase??a para el usuario Carlos (Mec??nico).
174	3	2026-04-14 14:41:48.838751	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
175	3	2026-04-14 14:41:52.105208	LOGOUT	El usuario Carlos (Mec??nico) cerr?? su sesi??n.
176	1	2026-04-14 14:41:53.81641	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
177	1	2026-04-14 14:42:54.932554	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
178	1	2026-04-14 15:14:50.892208	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
179	1	2026-04-14 15:16:57.0736	CREACI??N	Registr?? al nuevo usuario: Ana Roca con el rol Cliente.
180	1	2026-04-14 15:17:09.095169	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
181	15	2026-04-14 15:17:20.216802	LOGIN	El usuario Ana Roca inici?? sesi??n en el sistema.
182	15	2026-04-14 15:17:32.654032	MODIFICACI??N	Cambi?? su contrase??a temporal obligatoria.
183	15	2026-04-14 15:17:54.288361	LOGIN	El usuario Ana Roca inici?? sesi??n en el sistema.
184	15	2026-04-14 15:18:57.293169	LOGOUT	El usuario Ana Roca cerr?? su sesi??n.
185	1	2026-04-14 15:18:59.957182	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
186	1	2026-04-14 15:19:35.119706	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
187	1	2026-04-14 15:20:16.580041	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
188	15	2026-04-14 15:21:39.115221	LOGIN	El usuario Ana Roca inici?? sesi??n en el sistema.
189	15	2026-04-14 15:22:05.655119	LOGOUT	El usuario Ana Roca cerr?? su sesi??n.
190	3	2026-04-14 15:22:18.860159	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
191	3	2026-04-14 15:22:33.729315	LOGOUT	El usuario Carlos (Mec??nico) cerr?? su sesi??n.
192	2	2026-04-14 15:23:31.49135	LOGIN	El usuario Maria (Recepcionista) inici?? sesi??n en el sistema.
193	1	2026-04-14 15:23:44.299307	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
194	1	2026-04-14 15:24:05.627977	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
195	2	2026-04-14 15:37:51.029448	LOGOUT	El usuario Maria (Recepcionista) cerr?? su sesi??n.
196	1	2026-04-14 15:38:00.877256	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
197	1	2026-04-15 22:30:32.594588	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
198	1	2026-04-15 22:31:16.185155	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
199	1	2026-04-15 22:35:18.594246	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
200	1	2026-04-16 01:48:24.454429	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
201	1	2026-04-16 01:50:39.8058	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
202	3	2026-04-16 01:50:51.345279	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
203	3	2026-04-16 01:50:53.238477	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
204	3	2026-04-16 01:50:54.040565	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
205	1	2026-04-16 01:50:59.887663	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
206	1	2026-04-16 01:51:01.162982	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
207	3	2026-04-16 01:51:08.857976	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
208	2	2026-04-16 01:57:23.888418	LOGIN	El usuario Maria (Recepcionista) inici?? sesi??n en el sistema.
209	2	2026-04-16 01:57:48.057281	LOGOUT	El usuario Maria (Recepcionista) cerr?? su sesi??n.
210	14	2026-04-16 01:59:14.712382	LOGIN	El usuario Maria Lopez inici?? sesi??n en el sistema.
211	14	2026-04-16 01:59:29.219924	LOGOUT	El usuario Maria Lopez cerr?? su sesi??n.
212	1	2026-04-16 02:00:52.544929	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
213	3	2026-04-16 02:03:02.593136	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
214	3	2026-04-16 02:05:36.761556	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
215	1	2026-04-16 02:05:39.892545	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
216	3	2026-04-16 02:06:34.175887	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
217	1	2026-04-16 02:07:53.507518	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
218	1	2026-04-16 02:07:57.753918	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
219	1	2026-04-16 03:53:25.570756	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
220	1	2026-04-16 03:55:19.688984	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
221	1	2026-04-16 03:55:36.526006	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
222	1	2026-04-16 03:55:43.39638	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
223	3	2026-04-16 03:59:23.282197	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
224	1	2026-04-16 03:59:53.771409	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
225	3	2026-04-16 03:59:56.847453	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
226	1	2026-04-16 04:00:58.346388	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
227	1	2026-04-16 04:01:06.91984	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
228	1	2026-04-16 04:01:44.56467	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
229	1	2026-04-16 05:54:20.218675	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
230	1	2026-04-16 05:54:27.247572	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
231	14	2026-04-16 05:54:35.335461	LOGIN	El usuario Maria Lopez inici?? sesi??n en el sistema.
232	14	2026-04-16 05:54:44.062763	LOGOUT	El usuario Maria Lopez cerr?? su sesi??n.
233	1	2026-04-16 05:58:35.75728	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
234	1	2026-04-16 06:05:37.923372	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
235	1	2026-04-16 06:05:53.30217	MODIFICACI??N	Actualiz?? usuario Clark Kent (Mec??nico) (estado: Inactivo, rol: Mec??nico).
236	1	2026-04-16 06:05:56.35172	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
237	1	2026-04-16 06:06:07.785404	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
238	1	2026-04-16 06:06:19.218639	MODIFICACI??N	Actualiz?? usuario Clark Kent (Mec??nico) (estado: Activo, rol: Mec??nico).
239	1	2026-04-16 06:10:29.810939	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
240	1	2026-04-16 06:10:30.028257	MODIFICACI??N	Actualiz?? cliente: Alex Arg.
241	1	2026-04-16 06:10:44.667723	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
242	1	2026-04-16 06:10:44.756874	MODIFICACI??N	Desactiv?? cliente: Alex Arg.
243	1	2026-04-16 13:46:53.1277	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
244	1	2026-04-16 13:47:04.644202	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
245	2	2026-04-16 14:09:37.855869	BLOQUEO_CUENTA	Cuenta bloqueada por 1 minuto tras 3 intentos fallidos de contrase??a para el usuario Maria (Recepcionista).
246	1	2026-04-16 14:10:06.415033	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
247	1	2026-04-16 14:10:24.409784	CREACI??N	Registr?? al nuevo usuario: Luis Prueba con el rol Cliente.
248	1	2026-04-16 14:10:30.380441	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
249	16	2026-04-16 14:10:38.492581	LOGIN	El usuario Luis Prueba inici?? sesi??n en el sistema.
250	3	2026-04-16 14:11:07.593795	SOLICITUD_RESET	Solicit?? recuperaci??n de contrase??a por correo.
251	1	2026-04-16 14:12:04.230318	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
252	1	2026-04-16 14:13:40.581566	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
253	3	2026-04-16 14:15:21.107937	LOGIN	El usuario Carlos (Mec??nico) inici?? sesi??n en el sistema.
254	3	2026-04-16 14:15:55.943805	LOGOUT	El usuario Carlos (Mec??nico) cerr?? su sesi??n.
255	1	2026-04-16 14:15:58.576231	LOGIN	El usuario Admin Principal inici?? sesi??n en el sistema.
256	1	2026-04-16 14:17:28.88917	LOGOUT	El usuario Admin Principal cerr?? su sesi??n.
257	1	2026-06-12 13:03:46.556438	LOGIN	El usuario Admin Principal inició sesión en el sistema.
258	1	2026-06-12 13:04:17.301088	LOGIN	El usuario Admin Principal inició sesión en el sistema.
259	1	2026-06-12 13:05:20.030417	LOGIN	El usuario Admin Principal inició sesión en el sistema.
260	1	2026-06-12 13:12:34.257034	LOGIN	El usuario Admin Principal inició sesión en el sistema.
261	1	2026-06-12 13:13:27.972614	LOGIN	El usuario Admin Principal inició sesión en el sistema.
262	1	2026-06-12 13:16:31.126076	LOGIN	El usuario Admin Principal inició sesión en el sistema.
263	1	2026-06-12 13:29:25.556395	LOGIN	El usuario Admin Principal inició sesión en el sistema.
264	1	2026-06-12 13:29:32.675914	LOGIN	El usuario Admin Principal inició sesión en el sistema.
265	1	2026-06-12 13:29:39.549192	LOGIN	El usuario Admin Principal inició sesión en el sistema.
266	1	2026-06-12 13:29:47.2025	LOGIN	El usuario Admin Principal inició sesión en el sistema.
267	1	2026-06-12 13:33:47.290637	LOGIN	El usuario Admin Principal inició sesión en el sistema.
268	1	2026-06-12 13:35:14.765094	LOGIN	El usuario Admin Principal inició sesión en el sistema.
269	1	2026-06-12 13:35:22.104636	LOGIN	El usuario Admin Principal inició sesión en el sistema.
270	1	2026-06-12 13:35:29.554919	LOGIN	El usuario Admin Principal inició sesión en el sistema.
271	1	2026-06-12 13:35:37.957886	LOGIN	El usuario Admin Principal inició sesión en el sistema.
272	1	2026-06-12 13:36:51.995408	LOGIN	El usuario Admin Principal inició sesión en el sistema.
273	1	2026-06-12 15:02:38.523989	LOGIN	El usuario Admin Principal inició sesión en el sistema.
274	1	2026-06-12 15:02:44.468062	LOGOUT	El usuario Admin Principal cerró su sesión.
275	1	2026-06-12 15:03:02.718549	LOGIN	El usuario Admin Principal inició sesión en el sistema.
276	1	2026-06-12 15:48:00.782316	LOGIN	El usuario Admin Principal inició sesión en el sistema.
277	1	2026-06-12 15:49:55.056237	LOGOUT	El usuario Admin Principal cerró su sesión.
278	1	2026-06-12 22:34:52.337547	LOGIN	El usuario Admin Principal inició sesión en el sistema.
279	1	2026-06-12 22:36:07.942074	CREACIÓN	Registró cliente: Jose Fernando Garcia (123456).
280	1	2026-06-12 22:55:02.275879	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
281	1	2026-06-12 22:55:04.439184	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
282	1	2026-06-12 22:57:24.763459	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
283	1	2026-06-12 22:57:26.611889	VERIFICACION_CODIGO	Verificó el código de recuperación de contraseña.
284	1	2026-06-13 04:00:44.553704	LOGIN	El usuario Admin Principal inició sesión en el sistema.
285	1	2026-06-13 04:09:26.891184	LOGIN	El usuario Admin Principal inició sesión en el sistema.
286	1	2026-06-13 04:10:38.277209	LOGIN	El usuario Admin Principal inició sesión en el sistema.
287	1	2026-06-13 04:12:41.720468	LOGIN	El usuario Admin Principal inició sesión en el sistema.
288	1	2026-06-13 04:12:43.841329	CREACIÓN	Registró cliente: Pedro Pruebas QA (QA-1781323963702).
289	1	2026-06-13 04:12:44.073059	CREACIÓN	Generó usuario cliente 'pedropruebasqa' al registrar cliente Pedro Pruebas QA.
290	1	2026-06-13 04:18:59.816588	LOGIN	El usuario Admin Principal inició sesión en el sistema.
291	1	2026-06-13 04:19:33.143272	LOGIN	El usuario Admin Principal inició sesión en el sistema.
292	1	2026-06-13 04:19:37.461898	MODIFICACIÓN	Actualizó usuario Jose Fernando Garcia (estado: Activo, rol: Cliente).
293	1	2026-06-13 04:22:54.520033	LOGIN	El usuario Admin Principal inició sesión en el sistema.
294	19	2026-06-13 04:23:34.350332	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
295	1	2026-06-13 04:37:47.423476	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
296	19	2026-06-13 04:44:08.779599	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
297	19	2026-06-13 04:46:11.160817	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
298	1	2026-06-13 04:50:09.864488	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
299	1	2026-06-13 04:50:39.011419	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
300	1	2026-06-13 04:51:38.777975	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
301	1	2026-06-13 04:52:22.735593	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
688	1	2026-06-15 03:22:13.096939	REPORTE	Accedió al Dashboard Analítico (CU19)
302	1	2026-06-13 04:52:23.36159	VERIFICACION_CODIGO	Verificó el código de recuperación de contraseña.
303	1	2026-06-13 04:52:23.646148	RESET_PASSWORD	Restableció su contraseña mediante enlace de recuperación.
304	1	2026-06-13 04:54:12.869341	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
305	1	2026-06-13 04:54:14.401061	LOGIN	El usuario Admin Principal inició sesión en el sistema.
306	19	2026-06-13 05:06:03.86827	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
307	19	2026-06-13 05:07:54.029029	VERIFICACION_CODIGO	Verificó el código de recuperación de contraseña.
308	19	2026-06-13 05:07:54.296301	RESET_PASSWORD	Restableció su contraseña mediante enlace de recuperación.
309	19	2026-06-13 05:08:34.787694	LOGIN	El usuario Jose Fernando Garcia inició sesión en el sistema.
310	19	2026-06-13 05:09:23.852865	LOGOUT	El usuario Jose Fernando Garcia cerró su sesión.
311	19	2026-06-13 05:09:35.293723	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
312	8	2026-06-13 05:17:13.843846	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
313	1	2026-06-13 05:19:37.653489	LOGIN	El usuario Admin Principal inició sesión en el sistema.
314	5	2026-06-13 05:20:56.439854	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
315	2	2026-06-13 05:21:03.780974	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
316	1	2026-06-13 05:22:45.967285	LOGOUT	El usuario Admin Principal cerró su sesión.
317	19	2026-06-13 05:22:57.481703	SOLICITUD_RESET	Solicitó un código de verificación para restablecer su contraseña.
321	1	2026-06-13 20:49:55.630258	LOGIN	El usuario Admin Principal inició sesión en el sistema.
322	22	2026-06-13 20:53:08.105446	REGISTRO	Se registró como nuevo cliente: Juan Fernandez.
323	22	2026-06-13 20:53:32.675895	VERIFICACION_CUENTA	Verificó su cuenta de cliente mediante el código enviado por correo.
324	22	2026-06-13 20:56:25.871019	LOGIN	El usuario Juan Fernandez inició sesión en el sistema.
325	1	2026-06-13 20:57:20.807697	LOGIN	El usuario Admin Principal inició sesión en el sistema.
326	1	2026-06-13 21:01:26.048625	REPORTE	Accedió al Dashboard Analítico (CU19)
327	1	2026-06-13 21:01:26.131554	REPORTE	Accedió al Dashboard Analítico (CU19)
330	1	2026-06-13 21:08:06.065076	LOGIN	El usuario Admin Principal inició sesión en el sistema.
331	1	2026-06-13 21:22:34.414552	LOGIN	El usuario Admin Principal inició sesión en el sistema.
332	1	2026-06-13 21:22:34.743521	CREACIÓN	Registró al nuevo usuario: CU02 Unique Test con el rol Cliente.
333	1	2026-06-13 21:23:10.617439	LOGIN	El usuario Admin Principal inició sesión en el sistema.
334	1	2026-06-13 21:37:51.936464	LOGIN	El usuario Admin Principal inició sesión en el sistema.
335	1	2026-06-13 21:41:58.21786	LOGIN	El usuario Admin Principal inició sesión en el sistema.
336	1	2026-06-13 21:42:52.942342	LOGIN	El usuario Admin Principal inició sesión en el sistema.
337	22	2026-06-13 21:45:27.028975	LOGIN	El usuario Juan Fernandez inició sesión en el sistema.
338	1	2026-06-13 21:46:23.305303	LOGIN	El usuario Admin Principal inició sesión en el sistema.
339	1	2026-06-14 00:54:26.18214	LOGIN	El usuario Admin Principal inició sesión en el sistema.
340	1	2026-06-14 02:26:17.218535	LOGIN	El usuario Admin Principal inició sesión en el sistema.
341	1	2026-06-14 02:28:37.55087	LOGIN	El usuario Admin Principal inició sesión en el sistema.
342	1	2026-06-14 02:29:46.005023	LOGIN	El usuario Admin Principal inició sesión en el sistema.
343	1	2026-06-14 02:30:19.899217	LOGIN	El usuario Admin Principal inició sesión en el sistema.
344	1	2026-06-14 02:31:24.822905	LOGIN	El usuario Admin Principal inició sesión en el sistema.
345	1	2026-06-14 02:35:48.117708	LOGIN	El usuario Admin Principal inició sesión en el sistema.
346	1	2026-06-14 03:05:23.570014	LOGIN	El usuario Admin Principal inició sesión en el sistema.
347	1	2026-06-14 03:06:36.140051	LOGIN	El usuario Admin Principal inició sesión en el sistema.
348	1	2026-06-14 03:07:33.333698	LOGIN	El usuario Admin Principal inició sesión en el sistema.
349	1	2026-06-14 03:09:18.591319	LOGIN	El usuario Admin Principal inició sesión en el sistema.
350	1	2026-06-14 03:10:50.413907	LOGIN	El usuario Admin Principal inició sesión en el sistema.
351	1	2026-06-14 03:12:12.084377	LOGIN	El usuario Admin Principal inició sesión en el sistema.
352	1	2026-06-14 03:13:20.943254	LOGIN	El usuario Admin Principal inició sesión en el sistema.
353	1	2026-06-14 03:20:47.422094	LOGIN	El usuario Admin Principal inició sesión en el sistema.
354	1	2026-06-14 03:21:07.688533	LOGIN	El usuario Admin Principal inició sesión en el sistema.
355	1	2026-06-14 03:23:26.434653	LOGIN	El usuario Admin Principal inició sesión en el sistema.
356	1	2026-06-14 03:27:37.877498	LOGIN	El usuario Admin Principal inició sesión en el sistema.
357	1	2026-06-14 03:27:48.018334	LOGOUT	El usuario Admin Principal cerró su sesión.
358	1	2026-06-14 03:29:51.697937	LOGIN	El usuario Admin Principal inició sesión en el sistema.
359	1	2026-06-14 03:33:13.231205	LOGIN	El usuario Admin Principal inició sesión en el sistema.
360	1	2026-06-14 03:36:28.818742	LOGIN	El usuario Admin Principal inició sesión en el sistema.
361	1	2026-06-14 03:39:03.449362	LOGIN	El usuario Admin Principal inició sesión en el sistema.
362	1	2026-06-14 03:40:40.602388	LOGIN	El usuario Admin Principal inició sesión en el sistema.
363	1	2026-06-14 03:42:55.834141	LOGIN	El usuario Admin Principal inició sesión en el sistema.
364	1	2026-06-14 03:45:58.765511	LOGIN	El usuario Admin Principal inició sesión en el sistema.
365	1	2026-06-14 03:47:14.130005	LOGIN	El usuario Admin Principal inició sesión en el sistema.
366	1	2026-06-14 03:49:37.882136	LOGIN	El usuario Admin Principal inició sesión en el sistema.
367	1	2026-06-14 03:49:43.305509	LOGIN	El usuario Admin Principal inició sesión en el sistema.
368	1	2026-06-14 03:52:17.901605	LOGIN	El usuario Admin Principal inició sesión en el sistema.
369	1	2026-06-14 03:52:23.386886	LOGIN	El usuario Admin Principal inició sesión en el sistema.
370	1	2026-06-14 03:54:12.182062	LOGOUT	El usuario Admin Principal cerró su sesión.
371	1	2026-06-14 03:54:26.780396	LOGIN	El usuario Admin Principal inició sesión en el sistema.
372	1	2026-06-14 04:04:31.371523	LOGIN	El usuario Admin Principal inició sesión en el sistema.
373	1	2026-06-14 04:06:41.359878	LOGIN	El usuario Admin Principal inició sesión en el sistema.
374	1	2026-06-14 04:07:13.431605	LOGIN	El usuario Admin Principal inició sesión en el sistema.
375	1	2026-06-14 04:09:06.873267	LOGIN	El usuario Admin Principal inició sesión en el sistema.
376	1	2026-06-14 04:10:26.886719	LOGIN	El usuario Admin Principal inició sesión en el sistema.
377	1	2026-06-14 04:11:29.240373	LOGOUT	El usuario Admin Principal cerró su sesión.
378	1	2026-06-14 04:11:52.069925	LOGIN	El usuario Admin Principal inició sesión en el sistema.
379	1	2026-06-14 04:17:08.832575	LOGIN	El usuario Admin Principal inició sesión en el sistema.
380	1	2026-06-14 04:18:13.111263	LOGIN	El usuario Admin Principal inició sesión en el sistema.
381	1	2026-06-14 04:19:33.253464	LOGIN	El usuario Admin Principal inició sesión en el sistema.
382	1	2026-06-14 04:23:36.688038	LOGIN	El usuario Admin Principal inició sesión en el sistema.
383	1	2026-06-14 04:24:56.716985	LOGIN	El usuario Admin Principal inició sesión en el sistema.
384	1	2026-06-14 04:26:07.054403	LOGIN	El usuario Admin Principal inició sesión en el sistema.
385	1	2026-06-14 04:26:52.194597	LOGIN	El usuario Admin Principal inició sesión en el sistema.
386	1	2026-06-14 04:27:28.644798	LOGIN	El usuario Admin Principal inició sesión en el sistema.
387	1	2026-06-14 04:28:06.998149	LOGIN	El usuario Admin Principal inició sesión en el sistema.
388	1	2026-06-14 04:34:35.846949	LOGIN	El usuario Admin Principal inició sesión en el sistema.
389	1	2026-06-14 04:35:26.868026	LOGIN	El usuario Admin Principal inició sesión en el sistema.
390	1	2026-06-14 04:37:26.398926	LOGIN	El usuario Admin Principal inició sesión en el sistema.
391	1	2026-06-14 04:38:33.459511	LOGIN	El usuario Admin Principal inició sesión en el sistema.
392	1	2026-06-14 04:39:25.813865	LOGIN	El usuario Admin Principal inició sesión en el sistema.
393	1	2026-06-14 04:39:57.503739	LOGIN	El usuario Admin Principal inició sesión en el sistema.
394	1	2026-06-14 04:41:27.555448	LOGOUT	El usuario Admin Principal cerró su sesión.
395	1	2026-06-14 04:41:29.647419	LOGIN	El usuario Admin Principal inició sesión en el sistema.
396	1	2026-06-14 04:46:27.161017	LOGIN	El usuario Admin Principal inició sesión en el sistema.
397	1	2026-06-14 04:46:35.073231	LOGIN	El usuario Admin Principal inició sesión en el sistema.
398	1	2026-06-14 04:46:42.72755	LOGIN	El usuario Admin Principal inició sesión en el sistema.
399	1	2026-06-14 04:46:50.413704	LOGIN	El usuario Admin Principal inició sesión en el sistema.
400	1	2026-06-14 04:46:58.247241	LOGIN	El usuario Admin Principal inició sesión en el sistema.
401	1	2026-06-14 04:48:07.806071	LOGIN	El usuario Admin Principal inició sesión en el sistema.
402	1	2026-06-14 04:48:16.443259	LOGIN	El usuario Admin Principal inició sesión en el sistema.
403	1	2026-06-14 04:48:24.685713	LOGIN	El usuario Admin Principal inició sesión en el sistema.
404	1	2026-06-14 04:54:09.454006	LOGIN	El usuario Admin Principal inició sesión en el sistema.
405	1	2026-06-14 04:54:17.37272	LOGIN	El usuario Admin Principal inició sesión en el sistema.
406	1	2026-06-14 04:54:25.157186	LOGIN	El usuario Admin Principal inició sesión en el sistema.
407	1	2026-06-14 04:54:32.846164	LOGIN	El usuario Admin Principal inició sesión en el sistema.
408	1	2026-06-14 04:54:40.636656	LOGIN	El usuario Admin Principal inició sesión en el sistema.
409	1	2026-06-14 04:54:48.520722	LOGIN	El usuario Admin Principal inició sesión en el sistema.
410	1	2026-06-14 04:54:56.531626	LOGIN	El usuario Admin Principal inició sesión en el sistema.
411	1	2026-06-14 04:55:04.270947	LOGIN	El usuario Admin Principal inició sesión en el sistema.
412	1	2026-06-14 04:55:12.029914	LOGIN	El usuario Admin Principal inició sesión en el sistema.
413	1	2026-06-14 04:55:19.840923	LOGIN	El usuario Admin Principal inició sesión en el sistema.
414	1	2026-06-14 04:55:27.572897	LOGIN	El usuario Admin Principal inició sesión en el sistema.
415	1	2026-06-14 04:57:51.582302	LOGIN	El usuario Admin Principal inició sesión en el sistema.
416	1	2026-06-14 04:57:56.325948	LOGIN	El usuario Admin Principal inició sesión en el sistema.
417	1	2026-06-14 04:58:00.916126	LOGIN	El usuario Admin Principal inició sesión en el sistema.
418	1	2026-06-14 04:58:05.834368	LOGIN	El usuario Admin Principal inició sesión en el sistema.
419	1	2026-06-14 04:58:10.934922	LOGIN	El usuario Admin Principal inició sesión en el sistema.
420	1	2026-06-14 04:58:15.827919	LOGIN	El usuario Admin Principal inició sesión en el sistema.
421	1	2026-06-14 05:00:27.168733	LOGIN	El usuario Admin Principal inició sesión en el sistema.
422	1	2026-06-14 05:01:26.751251	LOGIN	El usuario Admin Principal inició sesión en el sistema.
423	1	2026-06-14 05:02:47.83722	LOGIN	El usuario Admin Principal inició sesión en el sistema.
424	1	2026-06-14 05:02:53.401665	LOGIN	El usuario Admin Principal inició sesión en el sistema.
425	1	2026-06-14 05:02:59.00061	LOGIN	El usuario Admin Principal inició sesión en el sistema.
426	1	2026-06-14 05:03:04.353354	LOGIN	El usuario Admin Principal inició sesión en el sistema.
427	1	2026-06-14 05:03:09.820105	LOGIN	El usuario Admin Principal inició sesión en el sistema.
428	1	2026-06-14 05:03:15.157304	LOGIN	El usuario Admin Principal inició sesión en el sistema.
429	1	2026-06-14 05:03:22.068536	LOGIN	El usuario Admin Principal inició sesión en el sistema.
430	1	2026-06-14 05:03:28.521181	LOGIN	El usuario Admin Principal inició sesión en el sistema.
431	1	2026-06-14 05:03:34.344794	LOGIN	El usuario Admin Principal inició sesión en el sistema.
432	1	2026-06-14 05:03:40.206157	LOGIN	El usuario Admin Principal inició sesión en el sistema.
433	1	2026-06-14 05:03:45.737532	LOGIN	El usuario Admin Principal inició sesión en el sistema.
434	1	2026-06-14 05:03:51.28988	LOGIN	El usuario Admin Principal inició sesión en el sistema.
435	1	2026-06-14 05:03:57.286585	LOGIN	El usuario Admin Principal inició sesión en el sistema.
436	1	2026-06-14 05:04:03.236731	LOGIN	El usuario Admin Principal inició sesión en el sistema.
437	1	2026-06-14 05:04:09.227811	LOGIN	El usuario Admin Principal inició sesión en el sistema.
438	1	2026-06-14 05:04:36.846371	LOGIN	El usuario Admin Principal inició sesión en el sistema.
439	1	2026-06-14 05:04:51.516569	LOGIN	El usuario Admin Principal inició sesión en el sistema.
440	1	2026-06-14 05:21:24.616395	LOGIN	El usuario Admin Principal inició sesión en el sistema.
441	1	2026-06-14 05:22:03.67183	LOGIN	El usuario Admin Principal inició sesión en el sistema.
442	1	2026-06-14 05:23:11.999136	LOGIN	El usuario Admin Principal inició sesión en el sistema.
443	1	2026-06-14 05:24:50.143918	LOGIN	El usuario Admin Principal inició sesión en el sistema.
444	1	2026-06-14 05:25:44.200556	LOGIN	El usuario Admin Principal inició sesión en el sistema.
445	1	2026-06-14 05:26:43.755115	LOGIN	El usuario Admin Principal inició sesión en el sistema.
446	1	2026-06-14 05:27:15.391221	LOGIN	El usuario Admin Principal inició sesión en el sistema.
447	1	2026-06-14 05:27:28.75425	LOGIN	El usuario Admin Principal inició sesión en el sistema.
448	1	2026-06-14 05:28:11.785257	LOGIN	El usuario Admin Principal inició sesión en el sistema.
449	1	2026-06-14 05:28:55.314613	LOGIN	El usuario Admin Principal inició sesión en el sistema.
450	1	2026-06-14 05:29:41.158066	LOGIN	El usuario Admin Principal inició sesión en el sistema.
451	1	2026-06-14 16:14:15.191186	LOGIN	El usuario Admin Principal inició sesión en el sistema.
452	1	2026-06-14 18:41:19.131248	LOGIN	El usuario Admin Principal inició sesión en el sistema.
453	1	2026-06-14 18:44:17.523726	LOGIN	El usuario Admin Principal inició sesión en el sistema.
454	1	2026-06-14 18:46:33.629568	LOGIN	El usuario Admin Principal inició sesión en el sistema.
455	1	2026-06-14 18:50:13.902994	LOGIN	El usuario Admin Principal inició sesión en el sistema.
456	1	2026-06-14 18:52:45.019572	LOGIN	El usuario Admin Principal inició sesión en el sistema.
457	1	2026-06-14 19:03:50.270281	LOGIN	El usuario Admin Principal inició sesión en el sistema.
458	1	2026-06-14 19:04:55.322679	LOGIN	El usuario Admin Principal inició sesión en el sistema.
459	1	2026-06-14 19:06:13.357374	LOGIN	El usuario Admin Principal inició sesión en el sistema.
460	1	2026-06-14 19:07:10.107701	LOGIN	El usuario Admin Principal inició sesión en el sistema.
461	1	2026-06-14 19:08:01.109637	LOGIN	El usuario Admin Principal inició sesión en el sistema.
462	1	2026-06-14 19:08:47.201394	LOGIN	El usuario Admin Principal inició sesión en el sistema.
463	1	2026-06-14 19:09:56.666133	LOGIN	El usuario Admin Principal inició sesión en el sistema.
464	1	2026-06-14 19:11:05.02	LOGIN	El usuario Admin Principal inició sesión en el sistema.
465	1	2026-06-14 19:19:06.421571	LOGIN	El usuario Admin Principal inició sesión en el sistema.
466	1	2026-06-14 19:27:45.844055	LOGIN	El usuario Admin Principal inició sesión en el sistema.
467	2	2026-06-14 19:29:38.773753	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
468	2	2026-06-14 19:29:49.691805	BLOQUEO_CUENTA	Cuenta bloqueada por 1 minuto tras 3 intentos fallidos de contraseña para el usuario Maria (Recepcionista).
469	2	2026-06-14 19:31:55.458384	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
470	8	2026-06-14 19:32:49.717342	LOGIN	El usuario Lisa inició sesión en el sistema.
471	1	2026-06-14 19:38:31.79577	LOGIN	El usuario Admin Principal inició sesión en el sistema.
472	1	2026-06-14 19:38:59.968002	LOGOUT	El usuario Admin Principal cerró su sesión.
473	1	2026-06-14 19:39:04.414556	LOGIN	El usuario Admin Principal inició sesión en el sistema.
474	1	2026-06-14 19:40:41.954066	MODIFICACIÓN	Actualizó el privilegio: Consultar Bitacora.
475	1	2026-06-14 19:48:50.822202	LOGIN	El usuario Admin Principal inició sesión en el sistema.
476	1	2026-06-14 19:49:39.107459	LOGIN	El usuario Admin Principal inició sesión en el sistema.
477	1	2026-06-14 19:55:00.177248	LOGIN	El usuario Admin Principal inició sesión en el sistema.
478	1	2026-06-14 20:00:38.511294	LOGIN	El usuario Admin Principal inició sesión en el sistema.
479	1	2026-06-14 20:01:32.984961	LOGIN	El usuario Admin Principal inició sesión en el sistema.
480	1	2026-06-14 20:07:25.850464	LOGIN	El usuario Admin Principal inició sesión en el sistema.
481	1	2026-06-14 20:08:19.255748	LOGIN	El usuario Admin Principal inició sesión en el sistema.
482	1	2026-06-14 20:19:53.173598	LOGIN	El usuario Admin Principal inició sesión en el sistema.
483	1	2026-06-14 20:19:56.178249	EXPORTACION	Exportó historial de mantenimiento de la motocicleta 1234-ABC.
484	1	2026-06-14 20:21:04.116376	LOGIN	El usuario Admin Principal inició sesión en el sistema.
485	1	2026-06-14 20:21:06.817035	EXPORTACION	Exportó historial de mantenimiento de la motocicleta 1234-ABC.
486	1	2026-06-14 20:21:52.955227	LOGIN	El usuario Admin Principal inició sesión en el sistema.
487	1	2026-06-14 20:21:55.769855	EXPORTACION	Exportó historial de mantenimiento de la motocicleta 1234-ABC.
488	1	2026-06-14 20:32:36.368998	LOGIN	El usuario Admin Principal inició sesión en el sistema.
489	1	2026-06-14 20:33:37.033729	LOGIN	El usuario Admin Principal inició sesión en el sistema.
490	1	2026-06-14 20:42:32.051371	LOGIN	El usuario Admin Principal inició sesión en el sistema.
491	1	2026-06-14 20:43:28.499602	LOGIN	El usuario Admin Principal inició sesión en el sistema.
492	1	2026-06-14 20:44:24.322102	LOGIN	El usuario Admin Principal inició sesión en el sistema.
493	1	2026-06-14 20:47:54.104158	LOGIN	El usuario Admin Principal inició sesión en el sistema.
494	1	2026-06-14 20:48:45.29005	LOGIN	El usuario Admin Principal inició sesión en el sistema.
495	1	2026-06-14 21:01:03.091926	LOGIN	El usuario Admin Principal inició sesión en el sistema.
496	1	2026-06-14 21:02:16.303775	LOGIN	El usuario Admin Principal inició sesión en el sistema.
497	1	2026-06-14 21:14:23.155276	LOGIN	El usuario Admin Principal inició sesión en el sistema.
498	1	2026-06-14 21:14:42.731333	LOGIN	El usuario Admin Principal inició sesión en el sistema.
499	1	2026-06-14 21:24:22.13426	LOGIN	El usuario Admin Principal inició sesión en el sistema.
500	1	2026-06-14 21:25:06.778403	LOGIN	El usuario Admin Principal inició sesión en el sistema.
501	1	2026-06-14 21:33:35.72989	LOGIN	El usuario Admin Principal inició sesión en el sistema.
502	1	2026-06-14 21:33:56.005722	LOGIN	El usuario Admin Principal inició sesión en el sistema.
503	1	2026-06-14 21:42:03.90036	LOGIN	El usuario Admin Principal inició sesión en el sistema.
504	1	2026-06-14 21:42:17.575599	LOGIN	El usuario Admin Principal inició sesión en el sistema.
505	1	2026-06-14 21:46:46.337643	LOGIN	El usuario Admin Principal inició sesión en el sistema.
506	1	2026-06-14 21:53:14.18099	LOGIN	El usuario Admin Principal inició sesión en el sistema.
507	1	2026-06-14 21:53:34.167198	LOGIN	El usuario Admin Principal inició sesión en el sistema.
508	1	2026-06-14 21:57:11.389745	MODIFICACIÓN	Actualizó cotización #1.
509	1	2026-06-14 22:05:09.113264	LOGIN	El usuario Admin Principal inició sesión en el sistema.
510	1	2026-06-14 22:06:04.400485	LOGIN	El usuario Admin Principal inició sesión en el sistema.
511	1	2026-06-14 22:06:08.096783	MODIFICACIÓN	Actualizó nota de trabajo #1.
512	1	2026-06-14 22:06:32.897519	LOGIN	El usuario Admin Principal inició sesión en el sistema.
513	1	2026-06-14 22:07:45.640814	LOGIN	El usuario Admin Principal inició sesión en el sistema.
514	1	2026-06-14 22:08:16.029589	LOGIN	El usuario Admin Principal inició sesión en el sistema.
515	1	2026-06-14 22:09:00.392217	LOGIN	El usuario Admin Principal inició sesión en el sistema.
516	1	2026-06-14 22:09:03.519331	ELIMINACIÓN	Eliminó nota de trabajo #5.
517	1	2026-06-14 22:10:14.389409	LOGIN	El usuario Admin Principal inició sesión en el sistema.
518	1	2026-06-14 22:10:57.830429	MODIFICACIÓN	Actualizó nota de trabajo #1.
519	1	2026-06-14 22:11:12.954299	MODIFICACIÓN	Actualizó nota de trabajo #2.
520	1	2026-06-14 22:11:25.445739	MODIFICACIÓN	Actualizó nota de trabajo #3.
521	1	2026-06-14 22:11:35.315118	MODIFICACIÓN	Actualizó nota de trabajo #3.
522	1	2026-06-14 22:18:49.02224	LOGIN	El usuario Admin Principal inició sesión en el sistema.
523	1	2026-06-14 22:19:49.178407	LOGIN	El usuario Admin Principal inició sesión en el sistema.
524	1	2026-06-14 22:30:34.157807	LOGIN	El usuario Admin Principal inició sesión en el sistema.
525	1	2026-06-14 22:32:25.175753	LOGIN	El usuario Admin Principal inició sesión en el sistema.
526	1	2026-06-14 22:32:53.800292	LOGIN	El usuario Admin Principal inició sesión en el sistema.
527	1	2026-06-14 22:32:57.869737	LOGIN	El usuario Admin Principal inició sesión en el sistema.
528	1	2026-06-14 22:33:23.524447	LOGIN	El usuario Admin Principal inició sesión en el sistema.
529	1	2026-06-14 22:33:27.362624	LOGIN	El usuario Admin Principal inició sesión en el sistema.
530	1	2026-06-14 22:34:32.847835	LOGIN	El usuario Admin Principal inició sesión en el sistema.
531	1	2026-06-14 22:34:48.528804	LOGIN	El usuario Admin Principal inició sesión en el sistema.
532	1	2026-06-14 22:35:36.760469	LOGIN	El usuario Admin Principal inició sesión en el sistema.
533	1	2026-06-14 22:36:12.284879	LOGIN	El usuario Admin Principal inició sesión en el sistema.
534	1	2026-06-14 22:37:00.863885	LOGIN	El usuario Admin Principal inició sesión en el sistema.
535	1	2026-06-14 22:47:07.598876	LOGIN	El usuario Admin Principal inició sesión en el sistema.
536	1	2026-06-14 22:47:46.4732	LOGIN	El usuario Admin Principal inició sesión en el sistema.
537	1	2026-06-14 22:48:33.35156	LOGIN	El usuario Admin Principal inició sesión en el sistema.
538	1	2026-06-14 22:56:25.826277	LOGIN	El usuario Admin Principal inició sesión en el sistema.
539	1	2026-06-14 22:56:29.49863	LOGIN	El usuario Admin Principal inició sesión en el sistema.
540	1	2026-06-14 22:57:23.289484	LOGIN	El usuario Admin Principal inició sesión en el sistema.
541	1	2026-06-14 22:57:26.53493	LOGIN	El usuario Admin Principal inició sesión en el sistema.
542	1	2026-06-14 22:59:12.935029	LOGIN	El usuario Admin Principal inició sesión en el sistema.
543	1	2026-06-14 22:59:15.836786	LOGIN	El usuario Admin Principal inició sesión en el sistema.
544	1	2026-06-14 23:12:50.705208	LOGIN	El usuario Admin Principal inició sesión en el sistema.
545	1	2026-06-14 23:14:12.531956	LOGIN	El usuario Admin Principal inició sesión en el sistema.
546	1	2026-06-14 23:15:04.744086	LOGIN	El usuario Admin Principal inició sesión en el sistema.
547	1	2026-06-14 23:18:40.449202	CREACIÓN	Registró producto: Freno de Disco.
548	1	2026-06-14 23:25:35.107821	LOGIN	El usuario Admin Principal inició sesión en el sistema.
549	1	2026-06-14 23:25:38.521703	LOGIN	El usuario Admin Principal inició sesión en el sistema.
550	1	2026-06-14 23:31:27.349804	MODIFICACIÓN	Actualizó producto: Aceite de Motor 10W-40.
551	1	2026-06-14 23:43:31.158551	LOGIN	El usuario Admin Principal inició sesión en el sistema.
552	1	2026-06-14 23:43:54.509852	LOGIN	El usuario Admin Principal inició sesión en el sistema.
553	1	2026-06-14 23:44:53.47854	LOGIN	El usuario Admin Principal inició sesión en el sistema.
554	1	2026-06-14 23:45:27.818144	LOGIN	El usuario Admin Principal inició sesión en el sistema.
555	1	2026-06-14 23:45:57.484608	LOGIN	El usuario Admin Principal inició sesión en el sistema.
556	1	2026-06-14 23:48:29.708354	LOGIN	El usuario Admin Principal inició sesión en el sistema.
557	1	2026-06-14 23:48:44.027439	LOGIN	El usuario Admin Principal inició sesión en el sistema.
558	1	2026-06-15 00:43:01.146756	LOGOUT	El usuario Admin Principal cerró su sesión.
559	1	2026-06-15 00:43:04.268663	LOGIN	El usuario Admin Principal inició sesión en el sistema.
560	1	2026-06-15 00:56:57.197812	LOGIN	El usuario Admin Principal inició sesión en el sistema.
561	1	2026-06-15 00:57:02.047757	LOGIN	El usuario Admin Principal inició sesión en el sistema.
562	1	2026-06-15 01:05:01.876053	LOGIN	El usuario Admin Principal inició sesión en el sistema.
563	1	2026-06-15 01:05:18.040469	LOGIN	El usuario Admin Principal inició sesión en el sistema.
564	1	2026-06-15 01:06:20.95474	LOGIN	El usuario Admin Principal inició sesión en el sistema.
565	1	2026-06-15 01:07:52.425658	LOGIN	El usuario Admin Principal inició sesión en el sistema.
566	1	2026-06-15 01:08:05.870203	LOGIN	El usuario Admin Principal inició sesión en el sistema.
567	1	2026-06-15 01:08:29.752857	LOGIN	El usuario Admin Principal inició sesión en el sistema.
568	1	2026-06-15 01:09:27.722362	LOGIN	El usuario Admin Principal inició sesión en el sistema.
569	1	2026-06-15 01:09:41.430408	LOGIN	El usuario Admin Principal inició sesión en el sistema.
570	1	2026-06-15 01:11:02.649695	MODIFICACIÓN	Actualizó proveedor: Importadora Repuestos S.A..
571	1	2026-06-15 01:16:28.373396	LOGIN	El usuario Admin Principal inició sesión en el sistema.
572	1	2026-06-15 01:16:33.147471	LOGIN	El usuario Admin Principal inició sesión en el sistema.
573	1	2026-06-15 01:30:16.166211	LOGIN	El usuario Admin Principal inició sesión en el sistema.
574	1	2026-06-15 01:31:23.000887	LOGIN	El usuario Admin Principal inició sesión en el sistema.
575	1	2026-06-15 01:32:12.097296	LOGIN	El usuario Admin Principal inició sesión en el sistema.
576	1	2026-06-15 01:41:06.40129	LOGIN	El usuario Admin Principal inició sesión en el sistema.
577	1	2026-06-15 01:42:50.904654	LOGIN	El usuario Admin Principal inició sesión en el sistema.
578	1	2026-06-15 01:43:19.528522	LOGIN	El usuario Admin Principal inició sesión en el sistema.
579	1	2026-06-15 01:44:07.886023	LOGIN	El usuario Admin Principal inició sesión en el sistema.
580	1	2026-06-15 01:51:01.942526	LOGIN	El usuario Admin Principal inició sesión en el sistema.
581	1	2026-06-15 01:51:28.698069	LOGIN	El usuario Admin Principal inició sesión en el sistema.
582	1	2026-06-15 01:52:56.295431	LOGIN	El usuario Admin Principal inició sesión en el sistema.
583	1	2026-06-15 01:53:01.50453	LOGIN	El usuario Admin Principal inició sesión en el sistema.
584	1	2026-06-15 01:58:06.052942	LOGIN	El usuario Admin Principal inició sesión en el sistema.
585	1	2026-06-15 01:58:10.522137	LOGIN	El usuario Admin Principal inició sesión en el sistema.
586	1	2026-06-15 02:11:05.197204	LOGIN	El usuario Admin Principal inició sesión en el sistema.
587	1	2026-06-15 02:11:07.371084	REPORTE	Generó reporte ingresos_por_periodo (consulta).
588	1	2026-06-15 02:11:08.43832	REPORTE	Generó reporte servicios_mas_realizados (consulta).
589	1	2026-06-15 02:11:09.582012	REPORTE	Generó reporte repuestos_mas_vendidos (consulta).
590	1	2026-06-15 02:11:10.69697	REPORTE	Generó reporte clientes_frecuentes (consulta).
591	1	2026-06-15 02:11:11.791448	REPORTE	Generó reporte ordenes_por_estado (consulta).
592	1	2026-06-15 02:11:12.884012	REPORTE	Generó reporte inventario_critico (consulta).
593	1	2026-06-15 02:16:40.401353	LOGIN	El usuario Admin Principal inició sesión en el sistema.
594	1	2026-06-15 02:16:42.739807	REPORTE	Generó reporte ingresos_por_periodo (consulta).
595	1	2026-06-15 02:16:43.587377	REPORTE	Generó reporte ingresos_por_periodo (export).
596	1	2026-06-15 02:16:49.017324	REPORTE	Generó reporte ingresos_por_periodo (export).
597	1	2026-06-15 02:16:55.758839	LOGIN	El usuario Admin Principal inició sesión en el sistema.
598	1	2026-06-15 02:16:57.229236	REPORTE	Generó reporte ingresos_por_periodo (consulta).
599	1	2026-06-15 02:19:33.722831	REPORTE	Generó reporte ingresos_por_periodo (consulta).
600	1	2026-06-15 02:19:47.382455	REPORTE	Generó reporte ingresos_por_periodo (export).
601	1	2026-06-15 02:20:16.215327	REPORTE	Generó reporte ingresos_por_periodo (export).
602	1	2026-06-15 02:28:48.995379	LOGIN	El usuario Admin Principal inició sesión en el sistema.
603	1	2026-06-15 02:29:13.57826	REPORTE	Generó reporte ingresos_por_periodo (export).
604	1	2026-06-15 02:29:13.813652	REPORTE	Generó reporte ingresos_por_periodo (export).
605	1	2026-06-15 02:29:14.201628	REPORTE	Generó reporte ingresos_por_periodo (export).
606	1	2026-06-15 02:29:14.819129	REPORTE	Generó reporte servicios_mas_realizados (export).
607	1	2026-06-15 02:29:14.999554	REPORTE	Generó reporte servicios_mas_realizados (export).
608	1	2026-06-15 02:29:15.177814	REPORTE	Generó reporte servicios_mas_realizados (export).
609	1	2026-06-15 02:29:15.543576	REPORTE	Generó reporte repuestos_mas_vendidos (export).
610	1	2026-06-15 02:29:15.733778	REPORTE	Generó reporte repuestos_mas_vendidos (export).
611	1	2026-06-15 02:29:15.939167	REPORTE	Generó reporte repuestos_mas_vendidos (export).
612	1	2026-06-15 02:29:16.393321	REPORTE	Generó reporte clientes_frecuentes (export).
613	1	2026-06-15 02:29:16.587228	REPORTE	Generó reporte clientes_frecuentes (export).
614	1	2026-06-15 02:29:16.797617	REPORTE	Generó reporte clientes_frecuentes (export).
615	1	2026-06-15 02:29:17.195885	REPORTE	Generó reporte ordenes_por_estado (export).
616	1	2026-06-15 02:29:17.418481	REPORTE	Generó reporte ordenes_por_estado (export).
617	1	2026-06-15 02:29:17.643525	REPORTE	Generó reporte ordenes_por_estado (export).
618	1	2026-06-15 02:29:18.030751	REPORTE	Generó reporte inventario_critico (export).
619	1	2026-06-15 02:29:18.221499	REPORTE	Generó reporte inventario_critico (export).
620	1	2026-06-15 02:29:18.510941	REPORTE	Generó reporte inventario_critico (export).
621	1	2026-06-15 02:38:32.436615	LOGIN	El usuario Admin Principal inició sesión en el sistema.
622	1	2026-06-15 02:38:33.870908	REPORTE	Generó reporte ingresos_por_periodo (consulta).
623	1	2026-06-15 02:38:34.734183	REPORTE	Generó reporte ingresos_por_periodo (export).
624	1	2026-06-15 02:38:36.950889	LOGIN	El usuario Admin Principal inició sesión en el sistema.
625	1	2026-06-15 02:40:36.732744	REPORTE	Generó reporte repuestos_mas_vendidos (consulta).
626	1	2026-06-15 02:40:39.933786	REPORTE	Generó reporte repuestos_mas_vendidos (export).
627	1	2026-06-15 02:46:21.4439	LOGIN	El usuario Admin Principal inició sesión en el sistema.
628	1	2026-06-15 02:48:07.052017	LOGIN	El usuario Admin Principal inició sesión en el sistema.
629	1	2026-06-15 02:48:10.094384	LOGIN	El usuario Admin Principal inició sesión en el sistema.
630	1	2026-06-15 02:48:58.815672	LOGIN	El usuario Admin Principal inició sesión en el sistema.
631	1	2026-06-15 02:51:13.500317	REPORTE	Accedió al Dashboard Analítico (CU19)
632	1	2026-06-15 02:51:13.560226	REPORTE	Accedió al Dashboard Analítico (CU19)
633	1	2026-06-15 02:51:21.149562	REPORTE	Accedió al Dashboard Analítico (CU19)
634	1	2026-06-15 02:51:21.200611	REPORTE	Accedió al Dashboard Analítico (CU19)
635	1	2026-06-15 02:51:56.893568	LOGIN	El usuario Admin Principal inició sesión en el sistema.
636	1	2026-06-15 02:52:47.507301	LOGIN	El usuario Admin Principal inició sesión en el sistema.
637	1	2026-06-15 02:52:51.113676	LOGIN	El usuario Admin Principal inició sesión en el sistema.
638	1	2026-06-15 02:53:21.600121	LOGIN	El usuario Admin Principal inició sesión en el sistema.
639	1	2026-06-15 02:53:24.303818	LOGIN	El usuario Admin Principal inició sesión en el sistema.
640	1	2026-06-15 02:55:24.532407	LOGIN	El usuario Admin Principal inició sesión en el sistema.
641	1	2026-06-15 02:55:24.888652	REPORTE	Accedió al Dashboard Analítico (CU19)
642	1	2026-06-15 02:55:24.973914	REPORTE	Accedió al Dashboard Analítico (CU19)
643	1	2026-06-15 02:55:45.838502	REPORTE	Accedió al Dashboard Analítico (CU19)
644	1	2026-06-15 02:55:45.892835	REPORTE	Accedió al Dashboard Analítico (CU19)
645	1	2026-06-15 02:56:26.05826	REPORTE	Accedió al Dashboard Analítico (CU19)
646	1	2026-06-15 02:56:26.106972	REPORTE	Accedió al Dashboard Analítico (CU19)
647	1	2026-06-15 03:01:06.40658	REPORTE	Accedió al Dashboard Analítico (CU19)
648	1	2026-06-15 03:01:06.476249	REPORTE	Accedió al Dashboard Analítico (CU19)
649	1	2026-06-15 03:02:02.214201	LOGIN	El usuario Admin Principal inició sesión en el sistema.
650	1	2026-06-15 03:02:02.667747	REPORTE	Accedió al Dashboard Analítico (CU19)
651	1	2026-06-15 03:02:02.753577	REPORTE	Accedió al Dashboard Analítico (CU19)
652	1	2026-06-15 03:03:54.268919	LOGIN	El usuario Admin Principal inició sesión en el sistema.
653	1	2026-06-15 03:03:54.748814	REPORTE	Accedió al Dashboard Analítico (CU19)
654	1	2026-06-15 03:03:54.871009	REPORTE	Accedió al Dashboard Analítico (CU19)
655	1	2026-06-15 03:04:32.935382	LOGIN	El usuario Admin Principal inició sesión en el sistema.
656	1	2026-06-15 03:04:33.451386	REPORTE	Accedió al Dashboard Analítico (CU19)
657	1	2026-06-15 03:04:33.558031	REPORTE	Accedió al Dashboard Analítico (CU19)
658	1	2026-06-15 03:05:17.416392	LOGIN	El usuario Admin Principal inició sesión en el sistema.
659	1	2026-06-15 03:05:18.016464	REPORTE	Accedió al Dashboard Analítico (CU19)
660	1	2026-06-15 03:05:18.150239	REPORTE	Accedió al Dashboard Analítico (CU19)
661	1	2026-06-15 03:05:54.208179	LOGIN	El usuario Admin Principal inició sesión en el sistema.
662	1	2026-06-15 03:05:54.642045	REPORTE	Accedió al Dashboard Analítico (CU19)
663	1	2026-06-15 03:05:54.752207	REPORTE	Accedió al Dashboard Analítico (CU19)
664	1	2026-06-15 03:06:48.353703	LOGIN	El usuario Admin Principal inició sesión en el sistema.
665	1	2026-06-15 03:06:48.980548	REPORTE	Accedió al Dashboard Analítico (CU19)
666	1	2026-06-15 03:06:49.135293	REPORTE	Accedió al Dashboard Analítico (CU19)
667	1	2026-06-15 03:07:21.445545	LOGIN	El usuario Admin Principal inició sesión en el sistema.
668	1	2026-06-15 03:07:21.862	REPORTE	Accedió al Dashboard Analítico (CU19)
669	1	2026-06-15 03:07:21.969386	REPORTE	Accedió al Dashboard Analítico (CU19)
670	1	2026-06-15 03:07:28.990367	REPORTE	Accedió al Dashboard Analítico (CU19)
671	1	2026-06-15 03:07:28.992229	REPORTE	Accedió al Dashboard Analítico (CU19)
672	1	2026-06-15 03:07:59.574146	LOGIN	El usuario Admin Principal inició sesión en el sistema.
673	1	2026-06-15 03:07:59.947497	REPORTE	Accedió al Dashboard Analítico (CU19)
674	1	2026-06-15 03:08:00.05329	REPORTE	Accedió al Dashboard Analítico (CU19)
675	1	2026-06-15 03:11:12.650591	LOGIN	El usuario Admin Principal inició sesión en el sistema.
676	1	2026-06-15 03:11:13.080348	REPORTE	Accedió al Dashboard Analítico (CU19)
677	1	2026-06-15 03:11:13.16345	REPORTE	Accedió al Dashboard Analítico (CU19)
678	1	2026-06-15 03:11:15.636474	REPORTE	Accedió al Dashboard Analítico (CU19)
679	1	2026-06-15 03:11:15.691417	REPORTE	Accedió al Dashboard Analítico (CU19)
680	1	2026-06-15 03:11:18.129473	REPORTE	Accedió al Dashboard Analítico (CU19)
681	1	2026-06-15 03:11:18.177029	REPORTE	Accedió al Dashboard Analítico (CU19)
682	1	2026-06-15 03:11:20.646827	REPORTE	Accedió al Dashboard Analítico (CU19)
683	1	2026-06-15 03:11:20.70004	REPORTE	Accedió al Dashboard Analítico (CU19)
684	1	2026-06-15 03:11:23.333833	REPORTE	Accedió al Dashboard Analítico (CU19)
685	1	2026-06-15 03:11:23.39152	REPORTE	Accedió al Dashboard Analítico (CU19)
686	1	2026-06-15 03:12:21.192372	REPORTE	Accedió al Dashboard Analítico (CU19)
687	1	2026-06-15 03:12:21.193791	REPORTE	Accedió al Dashboard Analítico (CU19)
689	1	2026-06-15 03:22:13.09881	REPORTE	Accedió al Dashboard Analítico (CU19)
690	1	2026-06-15 03:22:38.130749	LOGIN	El usuario Admin Principal inició sesión en el sistema.
691	1	2026-06-15 03:22:38.657132	REPORTE	Accedió al Dashboard Analítico (CU19)
692	1	2026-06-15 03:22:38.762004	REPORTE	Accedió al Dashboard Analítico (CU19)
693	1	2026-06-15 03:22:42.233862	LOGIN	El usuario Admin Principal inició sesión en el sistema.
694	1	2026-06-15 03:22:42.64385	REPORTE	Accedió al Dashboard Analítico (CU19)
695	1	2026-06-15 03:22:42.735129	REPORTE	Accedió al Dashboard Analítico (CU19)
696	1	2026-06-15 03:24:00.80785	REPORTE	Accedió al Dashboard Analítico (CU19)
697	1	2026-06-15 03:24:00.860075	REPORTE	Accedió al Dashboard Analítico (CU19)
698	1	2026-06-15 03:25:29.939355	LOGIN	El usuario Admin Principal inició sesión en el sistema.
699	1	2026-06-15 03:25:30.939426	REPORTE	Accedió al Dashboard Analítico (CU19)
700	1	2026-06-15 03:25:31.038201	REPORTE	Accedió al Dashboard Analítico (CU19)
701	1	2026-06-15 03:25:34.831081	LOGIN	El usuario Admin Principal inició sesión en el sistema.
702	1	2026-06-15 03:25:36.356083	REPORTE	Accedió al Dashboard Analítico (CU19)
703	1	2026-06-15 03:25:36.449041	REPORTE	Accedió al Dashboard Analítico (CU19)
704	1	2026-06-15 03:25:53.410304	REPORTE	Accedió al Dashboard Analítico (CU19)
705	1	2026-06-15 03:25:53.47874	REPORTE	Accedió al Dashboard Analítico (CU19)
706	1	2026-06-15 03:26:04.590479	REPORTE	Accedió al Dashboard Analítico (CU19)
707	1	2026-06-15 03:26:04.652782	REPORTE	Accedió al Dashboard Analítico (CU19)
708	1	2026-06-15 03:38:47.50532	LOGIN	El usuario Admin Principal inició sesión en el sistema.
709	1	2026-06-15 03:40:28.850077	LOGIN	El usuario Admin Principal inició sesión en el sistema.
710	1	2026-06-15 03:43:05.382408	LOGIN	El usuario Admin Principal inició sesión en el sistema.
711	1	2026-06-15 03:44:43.45503	LOGIN	El usuario Admin Principal inició sesión en el sistema.
712	1	2026-06-15 03:45:40.20166	LOGIN	El usuario Admin Principal inició sesión en el sistema.
713	1	2026-06-15 03:45:43.990599	MODIFICACI�N	Actualiz� los permisos de m�dulos por rol.
714	1	2026-06-15 03:47:16.109996	LOGIN	El usuario Admin Principal inició sesión en el sistema.
715	1	2026-06-15 03:55:55.815201	LOGIN	El usuario Admin Principal inició sesión en el sistema.
716	1	2026-06-15 03:55:57.527854	MODIFICACI�N	Actualiz� los permisos de m�dulos por rol.
717	1	2026-06-15 03:56:59.995065	LOGIN	El usuario Admin Principal inició sesión en el sistema.
718	1	2026-06-15 04:07:58.081885	LOGIN	El usuario Admin Principal inició sesión en el sistema.
719	1	2026-06-15 04:08:14.4349	LOGIN	El usuario Admin Principal inició sesión en el sistema.
720	1	2026-06-15 04:17:06.98801	LOGIN	El usuario Admin Principal inició sesión en el sistema.
721	1	2026-06-15 04:17:12.403681	LOGIN	El usuario Admin Principal inició sesión en el sistema.
722	1	2026-06-15 04:31:23.230532	LOGIN	El usuario Admin Principal inició sesión en el sistema.
723	1	2026-06-15 04:32:18.94619	LOGIN	El usuario Admin Principal inició sesión en el sistema.
724	1	2026-06-15 04:34:15.755043	LOGIN	El usuario Admin Principal inició sesión en el sistema.
725	1	2026-06-15 04:37:08.898142	LOGIN	El usuario Admin Principal inició sesión en el sistema.
726	1	2026-06-15 04:37:14.450442	LOGIN	El usuario Admin Principal inició sesión en el sistema.
727	1	2026-06-15 04:42:05.742778	LOGIN	El usuario Admin Principal inició sesión en el sistema.
728	22	2026-06-15 04:43:36.568592	LOGIN	El usuario Juan Fernandez inició sesión en el sistema.
729	1	2026-06-15 04:45:26.016842	MODIFICACI�N	Actualiz� los permisos de m�dulos por rol.
730	14	2026-06-15 05:08:02.252868	LOGIN	El usuario Maria Lopez inició sesión en el sistema.
731	14	2026-06-15 05:08:06.550642	LOGIN	El usuario Maria Lopez inició sesión en el sistema.
732	14	2026-06-15 05:08:10.553664	LOGIN	El usuario Maria Lopez inició sesión en el sistema.
733	17	2026-06-15 05:09:46.871359	LOGIN	El usuario Roberto Gomez inició sesión en el sistema.
734	17	2026-06-15 05:09:51.043002	LOGIN	El usuario Roberto Gomez inició sesión en el sistema.
735	22	2026-06-15 05:16:14.218387	LOGOUT	El usuario Juan Fernandez cerró su sesión.
736	14	2026-06-15 05:16:15.825409	LOGIN	El usuario Maria Lopez inició sesión en el sistema.
737	14	2026-06-15 05:16:17.846768	LOGOUT	El usuario Maria Lopez cerró su sesión.
738	1	2026-06-15 05:17:19.102047	CREACIÓN	Registró al nuevo usuario: Jorge Fuentes con el rol Mec??nico.
739	25	2026-06-15 05:17:42.834636	LOGIN	El usuario Jorge Fuentes inició sesión en el sistema.
740	3	2026-06-15 05:44:33.959454	LOGIN	El usuario Carlos (Mec??nico) inició sesión en el sistema.
741	3	2026-06-15 05:44:40.669383	LOGIN	El usuario Carlos (Mec??nico) inició sesión en el sistema.
742	3	2026-06-15 05:44:45.396635	LOGIN	El usuario Carlos (Mec??nico) inició sesión en el sistema.
743	3	2026-06-15 05:47:02.185645	LOGIN	El usuario Carlos (Mec??nico) inició sesión en el sistema.
744	2	2026-06-15 05:48:17.243691	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
745	2	2026-06-15 05:48:35.407676	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
746	3	2026-06-15 05:51:02.535316	LOGIN	El usuario Carlos (Mec??nico) inició sesión en el sistema.
747	3	2026-06-15 05:51:04.061529	LOGOUT	El usuario Carlos (Mec??nico) cerró su sesión.
748	25	2026-06-15 05:51:35.057957	LOGOUT	El usuario Jorge Fuentes cerró su sesión.
749	22	2026-06-15 05:53:38.166808	LOGIN	El usuario Juan Fernandez inició sesión en el sistema.
750	22	2026-06-15 05:53:50.916916	LOGOUT	El usuario Juan Fernandez cerró su sesión.
751	22	2026-06-15 05:54:03.07992	LOGIN	El usuario Juan Fernandez inició sesión en el sistema.
752	22	2026-06-15 05:54:13.738577	LOGOUT	El usuario Juan Fernandez cerró su sesión.
753	25	2026-06-15 05:54:29.92974	LOGIN	El usuario Jorge Fuentes inició sesión en el sistema.
754	25	2026-06-15 05:54:42.040143	LOGOUT	El usuario Jorge Fuentes cerró su sesión.
755	1	2026-06-15 05:55:25.013009	LOGIN	El usuario Admin Principal inició sesión en el sistema.
756	1	2026-06-15 05:57:10.904262	CREACIÓN	Registró al nuevo usuario: Rider Bismark Calzadilla Gutierrez con el rol Recepcionista.
757	26	2026-06-15 05:57:45.765824	LOGIN	El usuario Rider Bismark Calzadilla Gutierrez inició sesión en el sistema.
758	1	2026-06-15 15:40:50.613416	LOGIN	El usuario Admin Principal inició sesión en el sistema.
759	26	2026-06-15 15:53:15.461118	LOGIN	El usuario Rider Bismark Calzadilla Gutierrez inició sesión en el sistema.
760	2	2026-06-15 15:57:09.839665	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
761	2	2026-06-15 15:57:16.402918	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
762	2	2026-06-15 15:57:26.842435	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
763	2	2026-06-15 15:58:18.269714	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
764	2	2026-06-15 15:58:24.142036	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
765	2	2026-06-15 15:58:29.094379	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
766	2	2026-06-15 15:58:43.21142	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
767	2	2026-06-15 15:58:48.14245	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
768	2	2026-06-15 15:58:53.365218	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
769	2	2026-06-15 16:01:19.687922	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
770	2	2026-06-15 16:01:25.079234	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
771	2	2026-06-15 16:01:30.302336	LOGIN	El usuario Maria (Recepcionista) inició sesión en el sistema.
772	26	2026-06-15 16:05:43.648552	LOGOUT	El usuario Rider Bismark Calzadilla Gutierrez cerró su sesión.
773	1	2026-06-15 16:14:01.818274	LOGIN	El usuario Admin Principal inició sesión en el sistema.
774	1	2026-06-15 17:00:34.989631	LOGOUT	El usuario Admin Principal cerró su sesión.
775	1	2026-06-15 17:00:41.020562	LOGIN	El usuario Admin Principal inició sesión en el sistema.
776	1	2026-06-15 17:54:17.993589	LOGIN	El usuario Admin Principal inició sesión en el sistema.
777	1	2026-06-15 18:03:21.285111	LOGIN	El usuario Admin Principal inició sesión en el sistema.
778	1	2026-06-15 18:03:28.99131	LOGIN	El usuario Admin Principal inició sesión en el sistema.
779	1	2026-06-15 18:03:35.029242	LOGIN	El usuario Admin Principal inició sesión en el sistema.
780	1	2026-06-15 18:03:47.611002	LOGIN	El usuario Admin Principal inició sesión en el sistema.
781	1	2026-06-15 18:04:15.143292	LOGIN	El usuario Admin Principal inició sesión en el sistema.
782	1	2026-06-15 18:07:06.546573	LOGIN	El usuario Admin Principal inició sesión en el sistema.
783	1	2026-06-15 18:08:50.073176	LOGIN	El usuario Admin Principal inició sesión en el sistema.
784	1	2026-06-15 18:12:18.658111	LOGIN	El usuario Admin Principal inició sesión en el sistema.
785	2	2026-06-15 18:12:37.466104	ACTUALIZACI??N	Maria (Recepcionista) cambi?? el estado de la Orden 3 a "Facturado"
786	1	2026-06-15 18:12:37.506753	FACTURACION	Procesó facturación de orden #3 (Método: QR, Estado pago: Pendiente).
787	2	2026-06-15 18:13:11.932241	ACTUALIZACI??N	Maria (Recepcionista) cambi?? el estado de la Orden 1 a "Facturado"
788	1	2026-06-15 18:13:11.941482	FACTURACION	Procesó facturación de orden #1 (Método: Efectivo, Estado pago: Pendiente).
789	1	2026-06-15 18:43:05.657196	LOGIN	El usuario Admin Principal inició sesión en el sistema.
790	1	2026-06-15 18:48:22.071255	LOGIN	El usuario Admin Principal inició sesión en el sistema.
791	1	2026-06-15 18:49:54.684268	LOGIN	El usuario Admin Principal inició sesión en el sistema.
792	1	2026-06-15 19:15:04.687475	LOGIN	El usuario Admin Principal inició sesión en el sistema.
793	1	2026-06-15 19:16:27.697749	LOGOUT	El usuario Admin Principal cerró su sesión.
795	3	2026-06-15 19:20:28.579728	CREACI??N	Carlos (Mec??nico) registr?? una nueva Orden de Trabajo (Cod: 5)
796	22	2026-06-15 19:25:22.370304	LOGIN	El usuario Juan Fernandez inició sesión en el sistema.
797	22	2026-06-15 19:39:10.17564	LOGOUT	El usuario Juan Fernandez cerró su sesión.
798	1	2026-06-15 19:39:12.858866	LOGIN	El usuario Admin Principal inició sesión en el sistema.
799	25	2026-06-15 19:47:21.409413	CREACI??N	Jorge Fuentes registr?? una nueva Orden de Trabajo (Cod: 6)
800	1	2026-06-15 19:47:21.428227	CREACIÓN	Registró orden de trabajo #6 para cliente ID 13.
801	25	2026-06-15 19:47:55.766566	LOGIN	El usuario Jorge Fuentes inició sesión en el sistema.
802	1	2026-06-16 15:54:36.718183	LOGIN	El usuario Admin Principal inició sesión en el sistema.
803	1	2026-06-16 15:57:35.728978	LOGOUT	El usuario Admin Principal cerró su sesión.
804	22	2026-06-16 15:58:06.149655	LOGIN	El usuario Juan Fernandez inició sesión en el sistema.
805	22	2026-06-16 15:59:50.847383	LOGOUT	El usuario Juan Fernandez cerró su sesión.
806	1	2026-06-16 16:00:00.886015	LOGIN	El usuario Admin Principal inició sesión en el sistema.
807	1	2026-06-17 06:24:11.110258	LOGIN	El usuario Admin Principal inició sesión en el sistema.
808	1	2026-06-17 06:24:28.38613	CREACIÓN	Registró al nuevo usuario: Prueba ConCedula con el rol Cliente.
809	1	2026-06-17 06:24:28.3896	CREACIÓN	Generó cliente vinculado: Prueba ConCedula (01010101010101).
810	1	2026-06-18 15:05:24.501342	LOGIN	El usuario Admin Principal inició sesión en el sistema.
811	1	2026-06-18 15:05:42.738756	LOGOUT	El usuario Admin Principal cerró su sesión.
812	1	2026-06-18 15:05:42.974796	LOGOUT	El usuario Admin Principal cerró su sesión.
813	1	2026-06-18 15:11:13.007829	LOGIN	El usuario Admin Principal inició sesión en el sistema.
\.


--
-- Data for Name: cliente; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.cliente (codigo, cedula, nombre, telefono, telefono_alternativo, direccion, email, fecha_registro, estado) FROM stdin;
1	8899776	Maria Lopez	76655443	\N	Av. Banzer 4to Anillo	maria@gmail.com	2026-04-13	Activo
2	5544332	Roberto Gomez	75544332	\N	Plan 3000	roberto@hotmail.com	2026-04-13	Activo
3	1122334	Ana Roca	74433221	\N	Villa 1ro de Mayo	ana.roca@yahoo.com	2026-04-13	Activo
4	3322110	Luis Prueba	70011222	\N	Av. Santos Dumont	luis@prueba.com	2026-04-13	Activo
9	6666668	Alex Arg	73189033				\N	Inactivo
10	123456	Jose Fernando Garcia	78944562		Los Pozoz	fcalanigarcia6@gmail.com	\N	Activo
11	QA-1781323963702	Pedro Pruebas QA	77712345				\N	Activo
13	13337783	Juan Fernandez	+591 73766956	\N	\N	juanfernandez123096@gmail.com	2026-06-13	Activo
\.


--
-- Data for Name: compra; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.compra (codigo, id_proveedor, numero_factura, fecha, subtotal, impuesto, total, metodo_pago, estado) FROM stdin;
1	1	FAC-5050	2026-04-13	1000.00	130.00	1000.00	Transferencia	Completada
2	2	FAC-1020	2026-04-13	1500.00	195.00	1500.00	Efectivo	Completada
3	2	FAC-NUEVA-777	2026-04-13	3000.00	390.00	3390.00	Efectivo	Completada
\.


--
-- Data for Name: cotizacion; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.cotizacion (codigo, id_cliente, id_motocicleta, fecha_emision, fecha_validez, subtotal, impuesto, total, estado) FROM stdin;
2	3	4	2026-04-13	2026-04-02	200.00	0.00	200.00	Aprobada
3	1	1	2026-04-13	2026-04-20	0.00	0.00	0.00	Pendiente
1	2	2	2026-04-13	2026-04-30	600.00	1.00	601.00	Pendiente
\.


--
-- Data for Name: detallecompra; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.detallecompra (codigo, id_compra, id_producto, cantidad, precio_compra, subtotal) FROM stdin;
1	1	1	10	50.00	500.00
2	1	5	10	40.00	400.00
3	2	4	5	300.00	1500.00
4	3	4	10	300.00	3000.00
\.


--
-- Data for Name: detallecotizacion; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.detallecotizacion (codigo, id_cotizacion, tipo, descripcion, cantidad, precio_unitario, subtotal) FROM stdin;
1	1	Repuesto	Pastillas de Freno	1	150.00	150.00
2	1	Repuesto	Llanta Trasera Pirelli	1	450.00	450.00
3	2	Mano de Obra	Ajuste de kit de arrastre	1	50.00	50.00
4	2	Mano de Obra	Revisi??n sistema el??ctrico	1	150.00	150.00
\.


--
-- Data for Name: detalleordentrabajo; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.detalleordentrabajo (codigo, id_orden_trabajo, id_producto, tipo, descripcion, cantidad, provisto_por_cliente, precio_unitario, subtotal) FROM stdin;
1	1	1	Repuesto	Cambio de Aceite Motul	1	f	80.00	80.00
2	1	2	Repuesto	Cambio de Buj??a NGK	1	t	0.00	0.00
3	1	\N	Mano de Obra	Servicio de Mantenimiento General	1	f	100.00	100.00
4	3	2	Repuesto	Buj??a Iridium nueva	1	f	60.00	60.00
5	3	\N	Mano de Obra	Cambio de buj??a y limpieza	1	f	50.00	50.00
6	2	3	Repuesto	Pastillas de freno tra??das por el due??o	1	t	0.00	0.00
\.


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.django_content_type (id, app_label, model) FROM stdin;
1	admin	logentry
2	auth	permission
3	auth	group
4	auth	user
5	contenttypes	contenttype
6	sessions	session
7	taller	authgroup
8	taller	authgrouppermissions
9	taller	authpermission
10	taller	authuser
11	taller	authusergroups
12	taller	authuseruserpermissions
13	taller	bitacora
14	taller	cliente
15	taller	compra
16	taller	cotizacion
17	taller	detallecompra
18	taller	detallecotizacion
19	taller	detalleordentrabajo
20	taller	djangoadminlog
21	taller	djangocontenttype
22	taller	djangomigrations
23	taller	djangosession
24	taller	factura
25	taller	motocicleta
26	taller	notaservicio
27	taller	notatrabajo
28	taller	ordentrabajo
29	taller	privilegio
30	taller	producto
31	taller	proveedor
32	taller	rol
33	taller	rolprivilegio
34	taller	usuario
35	taller	permisomodulo
36	taller	seguimiento
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	contenttypes	0001_initial	2026-04-13 04:58:36.201339+00
2	auth	0001_initial	2026-04-13 04:58:36.342776+00
3	admin	0001_initial	2026-04-13 04:58:36.379665+00
4	admin	0002_logentry_remove_auto_add	2026-04-13 04:58:36.388058+00
5	admin	0003_logentry_add_action_flag_choices	2026-04-13 04:58:36.397705+00
6	contenttypes	0002_remove_content_type_name	2026-04-13 04:58:36.415308+00
7	auth	0002_alter_permission_name_max_length	2026-04-13 04:58:36.425583+00
8	auth	0003_alter_user_email_max_length	2026-04-13 04:58:36.434771+00
9	auth	0004_alter_user_username_opts	2026-04-13 04:58:36.443419+00
10	auth	0005_alter_user_last_login_null	2026-04-13 04:58:36.452338+00
11	auth	0006_require_contenttypes_0002	2026-04-13 04:58:36.456151+00
12	auth	0007_alter_validators_add_error_messages	2026-04-13 04:58:36.465064+00
13	auth	0008_alter_user_username_max_length	2026-04-13 04:58:36.481013+00
14	auth	0009_alter_user_last_name_max_length	2026-04-13 04:58:36.491658+00
15	auth	0010_alter_group_name_max_length	2026-04-13 04:58:36.503225+00
16	auth	0011_update_proxy_permissions	2026-04-13 04:58:36.511504+00
17	auth	0012_alter_user_first_name_max_length	2026-04-13 04:58:36.520018+00
18	sessions	0001_initial	2026-04-13 04:58:36.551946+00
19	taller	0001_initial	2026-04-13 21:34:55.686799+00
20	taller	0002_add_estado_cliente_motocicleta	2026-04-14 06:46:07.681021+00
21	taller	0003_permisomodulo_seguimiento	2026-06-12 13:02:33.08926+00
22	taller	0004_alter_cliente_options_alter_ordentrabajo_options	2026-06-12 13:02:33.098162+00
23	taller	0005_factura_metodo_pago_comprobante	2026-06-15 17:54:51.477725+00
\.


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
\.


--
-- Data for Name: factura; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.factura (codigo, id_nota_servicio, numero_autorizacion, fecha_emision, monto_servicio_facturado, impuesto, total_facturado, nit_cliente, razon_social, metodo_pago, comprobante_pago) FROM stdin;
3	3	AUT-309479	2026-06-15	50.00	6.50	56.50	1122334	Ana Roca	\N	\N
4	3	\N	2026-06-15	50.00	0.00	50.00	123456789	Cliente de Prueba SRL	QR	comprobantes/orden_3_tmp_comprobante.png
5	4	AUT-798079	2026-06-15	100.00	13.00	113.00	8899776	Maria Lopez	\N	\N
6	4	\N	2026-06-15	100.00	0.00	100.00	987654321	Otro Cliente SRL	Efectivo	\N
\.


--
-- Data for Name: motocicleta; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.motocicleta (codigo, id_cliente, placa, marca, modelo, anio, cilindraje, color, numero_motor, numero_chasis, kilometraje_actual, estado) FROM stdin;
1	1	1234-ABC	Honda	Navi	2022	110cc	Rojo	\N	\N	5400.50	Activo
2	2	5678-DEF	Yamaha	FZ-S	2020	150cc	Negro	\N	\N	15200.00	Activo
3	2	9012-GHI	Suzuki	Gixxer	2023	155cc	Azul	\N	\N	2100.00	Activo
4	3	3456-JKL	KTM	Duke 200	2021	200cc	Naranja	\N	\N	18500.00	Activo
9	13	TEST-PAGO	Honda	CBR	2022	150cc	Rojo	\N	\N	\N	Activo
\.


--
-- Data for Name: notaservicio; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.notaservicio (codigo, id_orden_trabajo, id_cliente, fecha_emision, total_repuestos, total_mano_obra, total_general, observaciones, estado_pago) FROM stdin;
3	3	3	2026-06-15	60.00	50.00	110.00	\N	Pendiente
4	1	1	2026-06-15	140.00	100.00	240.00	\N	Pendiente
\.


--
-- Data for Name: notatrabajo; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.notatrabajo (codigo, id_orden_trabajo, id_mecanico, fecha_hora, contenido, tipo_nota) FROM stdin;
4	3	2	2026-04-13 05:30:28.791839	Cambio de estado autom??tico de En revisi??n a Finalizado	Sistema
1	2	2	2026-04-13 09:30:00	Se detecto que el disco de freno esta desgastado. Se recomienda cambio.	Diagnostico
2	2	2	2026-04-13 09:30:00	El cliente autorizo el cambio de disco, esperando que llegue el repuesto.	Avance
3	3	3	2026-04-13 13:30:00	La moto ingresa con falla de encendido intermitente. Se revisara la bateria.	Diagnostico
6	3	2	2026-06-15 18:12:37.466104	Cambio de estado autom??tico de Finalizado a Facturado	Sistema
7	1	2	2026-06-15 18:13:11.932241	Cambio de estado autom??tico de Finalizado a Facturado	Sistema
\.


--
-- Data for Name: ordentrabajo; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.ordentrabajo (codigo, id_cotizacion, id_cliente, id_motocicleta, id_mecanico, fecha_creacion, fecha_inicio, fecha_fin, kilometraje_ingreso, estado, prioridad, costo_mano_obra, costo_repuestos, total) FROM stdin;
2	\N	2	2	3	2026-04-13	2026-03-25	\N	15150.00	Esperando repuesto	Normal	0.00	0.00	0.00
3	\N	3	4	2	2026-04-13	2026-03-26	2026-04-13	18500.00	Facturado	Normal	50.00	60.00	110.00
1	\N	1	1	2	2026-04-13	2026-03-20	2026-03-21	5400.00	Facturado	Normal	100.00	140.00	240.00
5	\N	13	9	3	2026-06-15	\N	\N	\N	Finalizado	Media	80.00	40.00	\N
6	3	13	1	25	2026-06-14	2026-06-14	\N	50.00	Pendiente	Normal	0.00	0.00	0.00
\.


--
-- Data for Name: permiso_modulo; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.permiso_modulo (id, id_rol, codigo_cu, nombre_modulo, accion, permitido) FROM stdin;
1168	3	CU08	Órdenes de Trabajo	Mostrar	t
1169	3	CU08	Órdenes de Trabajo	Buscar	t
1170	3	CU09	Notas de Trabajo	Mostrar	t
1171	3	CU09	Notas de Trabajo	Buscar	t
1172	3	CU09	Notas de Trabajo	Adicionar	t
1173	3	CU10	Productos	Mostrar	t
1174	3	CU10	Productos	Buscar	t
1175	3	CU11	Proveedores	Mostrar	t
1176	3	CU11	Proveedores	Buscar	t
1177	3	CU13	Inventario	Mostrar	t
1178	3	CU13	Inventario	Buscar	t
830	4	CU01	Gestionar Inicio y Cierre de Sesión	Mostrar	f
831	4	CU01	Gestionar Inicio y Cierre de Sesión	Buscar	f
832	4	CU01	Gestionar Inicio y Cierre de Sesión	Eliminar	f
833	4	CU02	Gestionar Usuarios y Asignar Roles	Mostrar	f
834	4	CU02	Gestionar Usuarios y Asignar Roles	Buscar	f
835	4	CU02	Gestionar Usuarios y Asignar Roles	Adicionar	f
836	4	CU02	Gestionar Usuarios y Asignar Roles	Eliminar	f
837	4	CU02	Gestionar Usuarios y Asignar Roles	Editar	f
838	4	CU03	Gestionar Roles y Asignar Permisos	Mostrar	f
839	4	CU03	Gestionar Roles y Asignar Permisos	Buscar	f
840	4	CU03	Gestionar Roles y Asignar Permisos	Adicionar	f
841	4	CU03	Gestionar Roles y Asignar Permisos	Eliminar	f
842	4	CU03	Gestionar Roles y Asignar Permisos	Editar	f
843	4	CU04	Gestionar Permisos	Mostrar	f
844	4	CU04	Gestionar Permisos	Editar	f
845	4	CU05	Gestionar Clientes	Mostrar	t
846	4	CU05	Gestionar Clientes	Buscar	f
847	4	CU05	Gestionar Clientes	Adicionar	f
848	4	CU05	Gestionar Clientes	Eliminar	f
849	4	CU05	Gestionar Clientes	Editar	f
850	4	CU06	Gestionar Motocicletas	Mostrar	t
851	4	CU06	Gestionar Motocicletas	Buscar	f
852	4	CU06	Gestionar Motocicletas	Adicionar	f
853	4	CU06	Gestionar Motocicletas	Eliminar	f
854	4	CU06	Gestionar Motocicletas	Editar	f
855	4	CU15	Consultar Historial de Mantenimiento	Mostrar	t
856	4	CU15	Consultar Historial de Mantenimiento	Buscar	f
857	4	CU15	Consultar Historial de Mantenimiento	Adicionar	f
858	4	CU15	Consultar Historial de Mantenimiento	Eliminar	f
859	4	CU16	Dar Seguimiento para Clientes	Mostrar	t
860	4	CU16	Dar Seguimiento para Clientes	Buscar	t
861	4	CU16	Dar Seguimiento para Clientes	Exportar	f
862	4	CU16	Dar Seguimiento para Clientes	Adicionar	f
863	4	CU07	Elaborar Cotizaciones	Mostrar	f
864	4	CU07	Elaborar Cotizaciones	Buscar	f
865	4	CU07	Elaborar Cotizaciones	Adicionar	f
866	4	CU07	Elaborar Cotizaciones	Eliminar	f
867	4	CU07	Elaborar Cotizaciones	Editar	f
868	4	CU08	Gestionar Órdenes de Trabajo	Mostrar	t
869	4	CU08	Gestionar Órdenes de Trabajo	Buscar	t
870	4	CU08	Gestionar Órdenes de Trabajo	Adicionar	f
871	4	CU08	Gestionar Órdenes de Trabajo	Eliminar	f
872	4	CU08	Gestionar Órdenes de Trabajo	Editar	f
873	4	CU09	Redactar Notas de Trabajo	Mostrar	t
874	4	CU09	Redactar Notas de Trabajo	Buscar	t
875	4	CU09	Redactar Notas de Trabajo	Adicionar	f
876	4	CU09	Redactar Notas de Trabajo	Eliminar	f
877	4	CU09	Redactar Notas de Trabajo	Editar	f
878	4	CU14	Emitir Facturación	Mostrar	t
879	4	CU14	Emitir Facturación	Buscar	t
880	4	CU14	Emitir Facturación	Adicionar	f
881	4	CU14	Emitir Facturación	Eliminar	f
882	4	CU14	Emitir Facturación	Editar	f
883	4	CU14	Emitir Facturación	Imprimir	f
884	4	CU10	Gestionar Productos (Repuestos)	Mostrar	f
885	4	CU10	Gestionar Productos (Repuestos)	Buscar	f
886	4	CU10	Gestionar Productos (Repuestos)	Adicionar	f
887	4	CU10	Gestionar Productos (Repuestos)	Eliminar	f
888	4	CU10	Gestionar Productos (Repuestos)	Editar	f
889	4	CU11	Monitorear Inventario	Mostrar	f
890	4	CU11	Monitorear Inventario	Buscar	f
891	4	CU11	Monitorear Inventario	Reportes	f
892	4	CU12	Procesar Compras a Proveedores	Mostrar	f
893	4	CU12	Procesar Compras a Proveedores	Buscar	f
894	4	CU12	Procesar Compras a Proveedores	Adicionar	f
895	4	CU12	Procesar Compras a Proveedores	Eliminar	f
896	4	CU12	Procesar Compras a Proveedores	Editar	f
897	4	CU13	Administrar Proveedores	Mostrar	f
898	4	CU13	Administrar Proveedores	Buscar	f
899	4	CU13	Administrar Proveedores	Adicionar	f
900	4	CU13	Administrar Proveedores	Eliminar	f
901	4	CU13	Administrar Proveedores	Editar	f
902	4	CU17	Configuración de Perfil Personal	Mostrar	t
903	4	CU17	Configuración de Perfil Personal	Editar	t
904	4	CU18	Generar Reportes	Mostrar	f
905	4	CU18	Generar Reportes	Buscar	f
906	4	CU18	Generar Reportes	Exportar	f
907	4	CU18	Generar Reportes	Descargar	f
908	4	CU19	Visualizar Dashboard Analítico	Mostrar	f
909	4	CU19	Visualizar Dashboard Analítico	Exportar	f
910	4	CU20	Auditoría de Operaciones – Bitácora	Mostrar	f
911	4	CU20	Auditoría de Operaciones – Bitácora	Buscar	f
912	4	CU20	Auditoría de Operaciones – Bitácora	Exportar	f
913	2	CU01	Gestionar Inicio y Cierre de Sesión	Mostrar	f
914	2	CU01	Gestionar Inicio y Cierre de Sesión	Buscar	f
915	2	CU01	Gestionar Inicio y Cierre de Sesión	Eliminar	f
916	2	CU02	Gestionar Usuarios y Asignar Roles	Mostrar	f
917	2	CU02	Gestionar Usuarios y Asignar Roles	Buscar	f
918	2	CU02	Gestionar Usuarios y Asignar Roles	Adicionar	f
919	2	CU02	Gestionar Usuarios y Asignar Roles	Eliminar	f
920	2	CU02	Gestionar Usuarios y Asignar Roles	Editar	f
921	2	CU03	Gestionar Roles y Asignar Permisos	Mostrar	f
922	2	CU03	Gestionar Roles y Asignar Permisos	Buscar	f
923	2	CU03	Gestionar Roles y Asignar Permisos	Adicionar	f
924	2	CU03	Gestionar Roles y Asignar Permisos	Eliminar	f
925	2	CU03	Gestionar Roles y Asignar Permisos	Editar	f
926	2	CU04	Gestionar Permisos	Mostrar	f
927	2	CU04	Gestionar Permisos	Editar	f
928	2	CU05	Gestionar Clientes	Mostrar	t
929	2	CU05	Gestionar Clientes	Buscar	t
930	2	CU05	Gestionar Clientes	Adicionar	t
931	2	CU05	Gestionar Clientes	Eliminar	t
932	2	CU05	Gestionar Clientes	Editar	t
933	2	CU06	Gestionar Motocicletas	Mostrar	t
934	2	CU06	Gestionar Motocicletas	Buscar	t
935	2	CU06	Gestionar Motocicletas	Adicionar	t
936	2	CU06	Gestionar Motocicletas	Eliminar	t
937	2	CU06	Gestionar Motocicletas	Editar	t
938	2	CU15	Consultar Historial de Mantenimiento	Mostrar	t
939	2	CU15	Consultar Historial de Mantenimiento	Buscar	t
940	2	CU15	Consultar Historial de Mantenimiento	Adicionar	f
941	2	CU15	Consultar Historial de Mantenimiento	Eliminar	f
942	2	CU15	Consultar Historial de Mantenimiento	Exportar	t
943	2	CU16	Dar Seguimiento para Clientes	Mostrar	t
944	2	CU16	Dar Seguimiento para Clientes	Buscar	t
945	2	CU16	Dar Seguimiento para Clientes	Exportar	f
946	2	CU16	Dar Seguimiento para Clientes	Adicionar	t
947	2	CU07	Elaborar Cotizaciones	Mostrar	t
948	2	CU07	Elaborar Cotizaciones	Buscar	t
949	2	CU07	Elaborar Cotizaciones	Adicionar	t
950	2	CU07	Elaborar Cotizaciones	Eliminar	f
951	2	CU07	Elaborar Cotizaciones	Editar	t
952	2	CU08	Gestionar Órdenes de Trabajo	Mostrar	t
953	2	CU08	Gestionar Órdenes de Trabajo	Buscar	t
954	2	CU08	Gestionar Órdenes de Trabajo	Adicionar	t
955	2	CU08	Gestionar Órdenes de Trabajo	Eliminar	f
956	2	CU08	Gestionar Órdenes de Trabajo	Editar	t
957	2	CU09	Redactar Notas de Trabajo	Mostrar	t
958	2	CU09	Redactar Notas de Trabajo	Buscar	t
959	2	CU09	Redactar Notas de Trabajo	Adicionar	t
960	2	CU09	Redactar Notas de Trabajo	Eliminar	f
961	2	CU09	Redactar Notas de Trabajo	Editar	f
962	2	CU14	Emitir Facturación	Mostrar	t
963	2	CU14	Emitir Facturación	Buscar	t
964	2	CU14	Emitir Facturación	Adicionar	t
965	2	CU14	Emitir Facturación	Eliminar	f
966	2	CU14	Emitir Facturación	Editar	f
967	2	CU14	Emitir Facturación	Imprimir	f
968	2	CU10	Gestionar Productos (Repuestos)	Mostrar	t
969	2	CU10	Gestionar Productos (Repuestos)	Buscar	t
970	2	CU10	Gestionar Productos (Repuestos)	Adicionar	t
971	2	CU10	Gestionar Productos (Repuestos)	Eliminar	t
972	2	CU10	Gestionar Productos (Repuestos)	Editar	t
973	2	CU11	Monitorear Inventario	Mostrar	t
974	2	CU11	Monitorear Inventario	Buscar	t
975	2	CU11	Monitorear Inventario	Reportes	f
976	2	CU11	Monitorear Inventario	Adicionar	t
977	2	CU11	Monitorear Inventario	Editar	t
978	2	CU11	Monitorear Inventario	Eliminar	t
979	2	CU12	Procesar Compras a Proveedores	Mostrar	t
980	2	CU12	Procesar Compras a Proveedores	Buscar	t
981	2	CU12	Procesar Compras a Proveedores	Adicionar	t
982	2	CU12	Procesar Compras a Proveedores	Eliminar	f
983	2	CU12	Procesar Compras a Proveedores	Editar	f
984	2	CU13	Administrar Proveedores	Mostrar	t
985	2	CU13	Administrar Proveedores	Buscar	t
986	2	CU13	Administrar Proveedores	Adicionar	t
987	2	CU13	Administrar Proveedores	Eliminar	t
988	2	CU13	Administrar Proveedores	Editar	t
989	2	CU17	Configuración de Perfil Personal	Mostrar	f
990	2	CU17	Configuración de Perfil Personal	Editar	f
991	2	CU18	Generar Reportes	Mostrar	t
992	2	CU18	Generar Reportes	Buscar	t
993	2	CU18	Generar Reportes	Exportar	t
994	2	CU18	Generar Reportes	Descargar	f
995	2	CU19	Visualizar Dashboard Analítico	Mostrar	f
996	2	CU19	Visualizar Dashboard Analítico	Exportar	f
997	2	CU20	Auditoría de Operaciones – Bitácora	Mostrar	f
998	2	CU20	Auditoría de Operaciones – Bitácora	Buscar	f
999	2	CU20	Auditoría de Operaciones – Bitácora	Exportar	f
1000	1	CU01	Gestionar Inicio y Cierre de Sesión	Mostrar	t
1001	1	CU01	Gestionar Inicio y Cierre de Sesión	Buscar	t
1002	1	CU01	Gestionar Inicio y Cierre de Sesión	Eliminar	t
1003	1	CU02	Gestionar Usuarios y Asignar Roles	Mostrar	t
1004	1	CU02	Gestionar Usuarios y Asignar Roles	Buscar	t
1005	1	CU02	Gestionar Usuarios y Asignar Roles	Adicionar	t
1006	1	CU02	Gestionar Usuarios y Asignar Roles	Eliminar	t
1007	1	CU02	Gestionar Usuarios y Asignar Roles	Editar	t
1008	1	CU02	Gestionar Usuarios y Asignar Roles	Exportar	t
1009	1	CU03	Gestionar Roles y Asignar Permisos	Mostrar	t
1010	1	CU03	Gestionar Roles y Asignar Permisos	Buscar	t
1011	1	CU03	Gestionar Roles y Asignar Permisos	Adicionar	t
1012	1	CU03	Gestionar Roles y Asignar Permisos	Eliminar	t
1013	1	CU03	Gestionar Roles y Asignar Permisos	Editar	t
1014	1	CU04	Gestionar Permisos	Mostrar	t
1015	1	CU04	Gestionar Permisos	Editar	t
1016	1	CU05	Gestionar Clientes	Mostrar	t
1017	1	CU05	Gestionar Clientes	Buscar	t
1018	1	CU05	Gestionar Clientes	Adicionar	t
1019	1	CU05	Gestionar Clientes	Eliminar	t
1020	1	CU05	Gestionar Clientes	Editar	t
1021	1	CU05	Gestionar Clientes	Exportar	t
1022	1	CU06	Gestionar Motocicletas	Mostrar	t
1023	1	CU06	Gestionar Motocicletas	Buscar	t
1024	1	CU06	Gestionar Motocicletas	Adicionar	t
1025	1	CU06	Gestionar Motocicletas	Eliminar	t
1026	1	CU06	Gestionar Motocicletas	Editar	t
1027	1	CU06	Gestionar Motocicletas	Exportar	t
1028	1	CU15	Consultar Historial de Mantenimiento	Mostrar	t
1029	1	CU15	Consultar Historial de Mantenimiento	Buscar	t
1030	1	CU15	Consultar Historial de Mantenimiento	Adicionar	t
1031	1	CU15	Consultar Historial de Mantenimiento	Eliminar	t
1032	1	CU15	Consultar Historial de Mantenimiento	Editar	t
1033	1	CU15	Consultar Historial de Mantenimiento	Exportar	t
1034	1	CU16	Dar Seguimiento para Clientes	Mostrar	t
1035	1	CU16	Dar Seguimiento para Clientes	Buscar	t
1036	1	CU16	Dar Seguimiento para Clientes	Exportar	t
1037	1	CU16	Dar Seguimiento para Clientes	Adicionar	t
1038	1	CU16	Dar Seguimiento para Clientes	Editar	t
1039	1	CU16	Dar Seguimiento para Clientes	Eliminar	t
1040	1	CU07	Elaborar Cotizaciones	Mostrar	t
1041	1	CU07	Elaborar Cotizaciones	Buscar	t
1042	1	CU07	Elaborar Cotizaciones	Adicionar	t
1043	1	CU07	Elaborar Cotizaciones	Eliminar	t
1044	1	CU07	Elaborar Cotizaciones	Editar	t
1045	1	CU07	Elaborar Cotizaciones	Exportar	t
1046	1	CU08	Gestionar Órdenes de Trabajo	Mostrar	t
1047	1	CU08	Gestionar Órdenes de Trabajo	Buscar	t
1048	1	CU08	Gestionar Órdenes de Trabajo	Adicionar	t
1049	1	CU08	Gestionar Órdenes de Trabajo	Eliminar	t
1050	1	CU08	Gestionar Órdenes de Trabajo	Editar	t
1051	1	CU08	Gestionar Órdenes de Trabajo	Exportar	t
1052	1	CU09	Redactar Notas de Trabajo	Mostrar	t
1053	1	CU09	Redactar Notas de Trabajo	Buscar	t
1054	1	CU09	Redactar Notas de Trabajo	Adicionar	t
1055	1	CU09	Redactar Notas de Trabajo	Eliminar	t
1056	1	CU09	Redactar Notas de Trabajo	Editar	t
1057	1	CU09	Redactar Notas de Trabajo	Exportar	t
1058	1	CU14	Emitir Facturación	Mostrar	t
1059	1	CU14	Emitir Facturación	Buscar	t
1060	1	CU14	Emitir Facturación	Adicionar	t
1061	1	CU14	Emitir Facturación	Eliminar	t
1062	1	CU14	Emitir Facturación	Editar	t
1063	1	CU14	Emitir Facturación	Imprimir	t
1064	1	CU14	Emitir Facturación	Exportar	t
1065	1	CU10	Gestionar Productos (Repuestos)	Mostrar	t
1066	1	CU10	Gestionar Productos (Repuestos)	Buscar	t
1067	1	CU10	Gestionar Productos (Repuestos)	Adicionar	t
1068	1	CU10	Gestionar Productos (Repuestos)	Eliminar	t
1069	1	CU10	Gestionar Productos (Repuestos)	Editar	t
1070	1	CU10	Gestionar Productos (Repuestos)	Exportar	t
1071	1	CU11	Monitorear Inventario	Mostrar	t
1072	1	CU11	Monitorear Inventario	Buscar	t
1073	1	CU11	Monitorear Inventario	Reportes	t
1074	1	CU11	Monitorear Inventario	Adicionar	t
1075	1	CU11	Monitorear Inventario	Editar	t
1076	1	CU11	Monitorear Inventario	Eliminar	t
1077	1	CU11	Monitorear Inventario	Exportar	t
1078	1	CU12	Procesar Compras a Proveedores	Mostrar	t
1079	1	CU12	Procesar Compras a Proveedores	Buscar	t
1080	1	CU12	Procesar Compras a Proveedores	Adicionar	t
1081	1	CU12	Procesar Compras a Proveedores	Eliminar	t
1082	1	CU12	Procesar Compras a Proveedores	Editar	t
1083	1	CU12	Procesar Compras a Proveedores	Exportar	t
1084	1	CU13	Administrar Proveedores	Mostrar	t
1085	1	CU13	Administrar Proveedores	Buscar	t
1086	1	CU13	Administrar Proveedores	Adicionar	t
1087	1	CU13	Administrar Proveedores	Eliminar	t
1088	1	CU13	Administrar Proveedores	Editar	t
1089	1	CU13	Administrar Proveedores	Exportar	t
1090	1	CU17	Configuración de Perfil Personal	Mostrar	t
1091	1	CU17	Configuración de Perfil Personal	Editar	t
1092	1	CU18	Generar Reportes	Mostrar	t
1093	1	CU18	Generar Reportes	Buscar	t
1094	1	CU18	Generar Reportes	Exportar	t
1095	1	CU18	Generar Reportes	Descargar	t
1096	1	CU18	Generar Reportes	Adicionar	t
1097	1	CU18	Generar Reportes	Editar	t
1098	1	CU18	Generar Reportes	Eliminar	t
1099	1	CU19	Visualizar Dashboard Analítico	Mostrar	t
1100	1	CU19	Visualizar Dashboard Analítico	Exportar	t
1101	1	CU19	Visualizar Dashboard Analítico	Buscar	t
1102	1	CU20	Auditoría de Operaciones – Bitácora	Mostrar	t
1103	1	CU20	Auditoría de Operaciones – Bitácora	Buscar	t
1104	1	CU20	Auditoría de Operaciones – Bitácora	Exportar	t
1105	2	CU05	Clientes	Mostrar	t
1107	2	CU05	Clientes	Buscar	t
1108	2	CU05	Clientes	Adicionar	t
1109	2	CU05	Clientes	Editar	t
1110	2	CU05	Clientes	Eliminar	t
1111	2	CU06	Motocicletas	Mostrar	t
1112	2	CU06	Motocicletas	Buscar	t
1113	2	CU06	Motocicletas	Adicionar	t
1114	2	CU06	Motocicletas	Editar	t
1115	2	CU06	Motocicletas	Eliminar	t
1116	2	CU07	Cotizaciones	Mostrar	t
1117	2	CU07	Cotizaciones	Buscar	t
1118	2	CU07	Cotizaciones	Adicionar	t
1119	2	CU07	Cotizaciones	Editar	t
1120	2	CU08	Órdenes de Trabajo	Mostrar	t
1121	2	CU08	Órdenes de Trabajo	Buscar	t
1122	2	CU08	Órdenes de Trabajo	Adicionar	t
1123	2	CU08	Órdenes de Trabajo	Editar	t
1124	2	CU09	Notas de Trabajo	Mostrar	t
1125	2	CU09	Notas de Trabajo	Buscar	t
1126	2	CU09	Notas de Trabajo	Adicionar	t
1127	2	CU10	Productos	Mostrar	t
1128	2	CU10	Productos	Buscar	t
1129	2	CU10	Productos	Adicionar	t
1130	2	CU10	Productos	Editar	t
1131	2	CU10	Productos	Eliminar	t
1132	2	CU11	Proveedores	Mostrar	t
1133	2	CU11	Proveedores	Buscar	t
1134	2	CU11	Proveedores	Adicionar	t
1135	2	CU11	Proveedores	Editar	t
1136	2	CU11	Proveedores	Eliminar	t
1137	2	CU12	Compras	Mostrar	t
1138	2	CU12	Compras	Buscar	t
1139	2	CU12	Compras	Adicionar	t
1140	2	CU13	Inventario	Mostrar	t
1141	2	CU13	Inventario	Buscar	t
1142	2	CU13	Inventario	Adicionar	t
1143	2	CU13	Inventario	Editar	t
1144	2	CU13	Inventario	Eliminar	t
1145	2	CU14	Facturación	Mostrar	t
1146	2	CU14	Facturación	Buscar	t
1147	2	CU14	Facturación	Adicionar	t
1148	2	CU15	Reportes	Mostrar	t
1149	2	CU15	Reportes	Buscar	t
1150	2	CU15	Reportes	Exportar	t
1151	2	CU16	Seguimiento de Clientes	Mostrar	t
1152	2	CU16	Seguimiento de Clientes	Buscar	t
1153	2	CU16	Seguimiento de Clientes	Adicionar	t
1154	2	CU18	Gestión de Roles y Permisos	Mostrar	t
1155	2	CU18	Gestión de Roles y Permisos	Buscar	t
1156	2	CU18	Gestión de Roles y Permisos	Exportar	t
1157	4	CU05	Clientes	Mostrar	t
1158	4	CU06	Motocicletas	Mostrar	t
1159	4	CU08	Órdenes de Trabajo	Mostrar	t
1160	4	CU08	Órdenes de Trabajo	Buscar	t
1161	4	CU09	Notas de Trabajo	Mostrar	t
1162	4	CU09	Notas de Trabajo	Buscar	t
1163	4	CU14	Facturación	Mostrar	t
1164	4	CU14	Facturación	Buscar	t
1165	4	CU16	Seguimiento de Clientes	Mostrar	t
1166	4	CU16	Seguimiento de Clientes	Buscar	t
1167	4	CU16	Seguimiento de Clientes	Adicionar	t
\.


--
-- Data for Name: privilegio; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.privilegio (codigo, nombre, descripcion) FROM stdin;
2	Gestionar Roles y Privilegios	Asignar roles y permisos a usuarios
3	Gestionar Clientes	Registrar y modificar datos de clientes (CU05)
4	Gestionar Motocicletas	Registrar y modificar datos de motos (CU06)
5	Crear Orden de Trabajo	Iniciar una nueva orden de servicio
6	Actualizar Estado de Orden	Cambiar estado, agregar repuestos y notas (Mec??nico)
7	Generar Factura	Realizar cobros y emitir notas de servicio
1	Gestionar Usuarios	edit test
8	Consultar Bitacora	Ver el registro de auditor??a del sistema (CU20)
\.


--
-- Data for Name: producto; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.producto (codigo, codigo_barras, nombre, categoria, marca, modelo_compatible, stock_actual, stock_minimo, precio_compra, precio_venta, ubicacion_almacen, estado) FROM stdin;
3	PROD-003	Pastillas de Freno Delanteras	Frenos	Brembo	\N	10	0	80.00	150.00	\N	Activo
5	PROD-005	Filtro de Aire	Consumibles	K&N	\N	12	0	40.00	75.00	\N	Activo
2	PROD-002	Buj??a Iridium	El??ctrico	NGK	\N	14	0	30.00	60.00	\N	Activo
4	PROD-004	Llanta Trasera 140/60	Neum??ticos	Pirelli	\N	15	0	300.00	450.00	\N	Activo
6	PROD-006	Freno de Disco	Freno	Bremo	-	20	1	50.00	55.00	-	Activo
1	PROD-001	Aceite de Motor 10W-40	Lubricantes	Motul	\N	20	2	50.00	80.00	-	Activo
\.


--
-- Data for Name: proveedor; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.proveedor (codigo, empresa, nit, contacto, telefono, email, direccion) FROM stdin;
2	Motopartes Express	55667788	Lic. Julia Ortiz	33112233	contacto@motopartes.bo	Zona Parque Industrial
1	Importadora Repuestos S.A.	10203040	Ing. Mario Vaca	33445566	ventas@repuestossa.com	Av. Cristo Redentor 4to Anillo
\.


--
-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.rol (codigo, nombre, descripcion) FROM stdin;
3	Mec??nico	Encargado de la reparaci??n y diagn??stico
4	Cliente	Acceso al portal web para seguimiento de su motocicleta
1	Administrador	edit smoke
2	Recepcionista	edit test
\.


--
-- Data for Name: rol_privilegio; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

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


--
-- Data for Name: seguimiento; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.seguimiento (codigo, fecha_hora, tipo_gestion, canal, mensaje, observaciones, id_cliente, id_usuario) FROM stdin;
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: usuario_taller
--

COPY public.usuario (codigo, id_rol, nombre, email, contrasena, telefono, estado, fecha_registro) FROM stdin;
5	4	Homero	homero@laroca.com	pbkdf2_sha256$600000$NklhtSZsTOa70Dc2TLCNrm$R6iiscAvIuGNqRc2gjGRvBlbPsQM5Ew+biPptF2tIJ4=	75934859	Activo	\N
7	3	Usuario Auditoria	auditoria_8908e5df@test.com	pbkdf2_sha256$600000$0vBgIsBKHyrl1CCQy7eLMN$MCPGqIHjRIbukXjEBQGJJ5nPo8AAJz9LLD8vdFazFNk=	70000000	Activo	\N
8	4	Lisa	lisa@laroca.com	pbkdf2_sha256$600000$FXUkCQRP7GqCOjtuGKQgK3$IeVJPd+p9JmnKlCPqnkgpHTs0FyFIZekzCqFy0irP9c=	99999999	Activo	\N
2	2	Maria (Recepcionista)	maria@laroca.com	pbkdf2_sha256$600000$lxU6ozQMd3oA316oiwlbZh$J3E4CAcXQjh2/V9SePqf22AnQH1LNoENCGysfl9TMvE=	66666666	Activo	2026-04-13
13	2	Tmp C1	tmp.c1.424690@laroca.com	pbkdf2_sha256$600000$FIponWMmVa8I40D4ezVneG$nwlKoxC5rTrzE3FXaHamFj0HvYfw3YfhWCXWa78hxwA=	70010000	Inactivo	\N
9	2	Recep Smoke Edit 20260413152012	recep.smoke.20260413152012@laroca.com	pbkdf2_sha256$600000$SoYk1K2NAsTCCIqmT2HSTf$Y1P0cSUk6Ss9KOWumtblz682jTauobHZa2g9Q04T60g=	79900000	Inactivo	\N
12	4	Ana Perez	anaperez	pbkdf2_sha256$600000$QnHF0xhfo4LKb44MvsOPx0$mCeEMLFj6OwROYqwRh3/QSYyoJERhqihKGch8sMbRPI=	70011122	Inactivo	\N
3	3	Carlos (Mec??nico)	carlos@laroca.com	pbkdf2_sha256$600000$kco3HuUj5fKBm5bSSyNARa$xLhJhfWfXfQi3+Gr8k+UT3SE6hRNOhZwKorkwSTlX98=	55555555	Activo	2026-04-13
4	3	Clark Kent (Mec??nico)	clark@laroca.com	pbkdf2_sha256$600000$5j1RIsR4vkpMU8sig82IBr$cujDG8dPxqqKkV9CMC7iUsuz8/dmWFmynwtXdVcTmcE=	76938475	Activo	\N
18	4	Alex Arg	alexarg	pbkdf2_sha256$600000$j97zu2v0wDwP9SHALjho79$63Xh9BWZfU4RMJJVNEmkneIvJSaET93W8qEl48KL3tM=	73189033	Activo	\N
20	4	Pedro Pruebas QA	pedropruebasqa	pbkdf2_sha256$600000$0d5Du3FYaNJIr7LNQqQ71h$/Y05fY/XS1H0Q84UiFl3uuJ2/60pjHnkg9ScxRzBGas=	77712345	Activo	\N
14	4	Maria Lopez	maria@gmail.com	pbkdf2_sha256$600000$59z5xgcCFfVGI64BIlkHG9$M4G4gaF4TtZfWx+I5v/4megRnnoumKbPKePHfJhf1ms=	76655443	Activo	\N
15	4	Ana Roca	ana.roca@yahoo.com	pbkdf2_sha256$600000$oXcP2ChlzLaSNAkkbB9KuQ$xHx0kBXkZl/wI67MNBAw6DmvX1jJqTdWl2uwPp5CDfc=	74433221	Activo	\N
16	4	Luis Prueba	luis@prueba.com	pbkdf2_sha256$600000$KkkTYkM5m36v18Kbof95br$Ps8lx3c860tbZB1xXSMh+rzNFOa4aL2VBJDgsRtnTAc=	70011222	Activo	\N
1	1	Admin Principal	admin@laroca.com	pbkdf2_sha256$600000$H9WSDy6MHXUd6z1X3ZFZwW$q6hSAWYIpt+sfUJR1QY1pfwS042cd03zR0NRVjEE2aE=	77777777	Activo	2026-04-13
19	4	Jose Fernando Garcia	fcalanigarcia6@gmail.com	pbkdf2_sha256$600000$ZgPWVnW5dShfGunVrRKXhQ$g0ThrHYS/cRzZn+oQWyiNDRvwpVaTmBUh6jwU6HhLA4=	78944562	Activo	\N
22	4	Juan Fernandez	juanfernandez123096@gmail.com	pbkdf2_sha256$600000$x3ouY1uOcxysW4ALT8Wv8E$xs9bwQ85mgufENQ1ujrUOq/fRvIEkBRpw1FyM1uI/DE=	+591 73766956	Activo	2026-06-13
17	4	Roberto Gomez	roberto@hotmail.com	pbkdf2_sha256$600000$VKpXtM649GH1lTxzwTZ13o$iM+eeJ1oKGKNq+ezc3cvOA6X7BH0ryC4lCORor8pU18=	75544332	Activo	\N
25	3	Jorge Fuentes	jorgefuentes@laroca.com	pbkdf2_sha256$600000$77fbl0WTozRhLrewKve88v$mHriNCr22TljWKjlC4o9VpPqZQoNGGN73ny8dyuF1q8=	74123548	Activo	\N
26	2	Rider Bismark Calzadilla Gutierrez	riderb@laroca.com	pbkdf2_sha256$600000$PqoumdSom3PtzXPuW2zGSJ$zcDdxqkWiJYvr0bidvRzEQYxgg+3jKKmna0nDlzBjk8=	79546321	Activo	\N
\.


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 144, true);


--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.auth_user_groups_id_seq', 1, false);


--
-- Name: auth_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.auth_user_id_seq', 1, false);


--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.auth_user_user_permissions_id_seq', 1, false);


--
-- Name: bitacora_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.bitacora_codigo_seq', 813, true);


--
-- Name: cliente_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.cliente_codigo_seq', 14, true);


--
-- Name: compra_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.compra_codigo_seq', 3, true);


--
-- Name: cotizacion_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.cotizacion_codigo_seq', 5, true);


--
-- Name: detallecompra_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.detallecompra_codigo_seq', 4, true);


--
-- Name: detallecotizacion_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.detallecotizacion_codigo_seq', 4, true);


--
-- Name: detalleordentrabajo_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.detalleordentrabajo_codigo_seq', 6, true);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 36, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 23, true);


--
-- Name: factura_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.factura_codigo_seq', 6, true);


--
-- Name: motocicleta_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.motocicleta_codigo_seq', 9, true);


--
-- Name: notaservicio_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.notaservicio_codigo_seq', 4, true);


--
-- Name: notatrabajo_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.notatrabajo_codigo_seq', 7, true);


--
-- Name: ordentrabajo_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.ordentrabajo_codigo_seq', 6, true);


--
-- Name: permiso_modulo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.permiso_modulo_id_seq', 1178, true);


--
-- Name: privilegio_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.privilegio_codigo_seq', 9, true);


--
-- Name: producto_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.producto_codigo_seq', 6, true);


--
-- Name: proveedor_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.proveedor_codigo_seq', 2, true);


--
-- Name: rol_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.rol_codigo_seq', 5, true);


--
-- Name: seguimiento_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.seguimiento_codigo_seq', 1, false);


--
-- Name: usuario_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: usuario_taller
--

SELECT pg_catalog.setval('public.usuario_codigo_seq', 27, true);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- Name: bitacora bitacora_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT bitacora_pkey PRIMARY KEY (codigo);


--
-- Name: cliente cliente_cedula_key; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_cedula_key UNIQUE (cedula);


--
-- Name: cliente cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (codigo);


--
-- Name: compra compra_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_pkey PRIMARY KEY (codigo);


--
-- Name: cotizacion cotizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.cotizacion
    ADD CONSTRAINT cotizacion_pkey PRIMARY KEY (codigo);


--
-- Name: detallecompra detallecompra_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.detallecompra
    ADD CONSTRAINT detallecompra_pkey PRIMARY KEY (codigo);


--
-- Name: detallecotizacion detallecotizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.detallecotizacion
    ADD CONSTRAINT detallecotizacion_pkey PRIMARY KEY (codigo);


--
-- Name: detalleordentrabajo detalleordentrabajo_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.detalleordentrabajo
    ADD CONSTRAINT detalleordentrabajo_pkey PRIMARY KEY (codigo);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: factura factura_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_pkey PRIMARY KEY (codigo);


--
-- Name: motocicleta motocicleta_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.motocicleta
    ADD CONSTRAINT motocicleta_pkey PRIMARY KEY (codigo);


--
-- Name: motocicleta motocicleta_placa_key; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.motocicleta
    ADD CONSTRAINT motocicleta_placa_key UNIQUE (placa);


--
-- Name: notaservicio notaservicio_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.notaservicio
    ADD CONSTRAINT notaservicio_pkey PRIMARY KEY (codigo);


--
-- Name: notatrabajo notatrabajo_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.notatrabajo
    ADD CONSTRAINT notatrabajo_pkey PRIMARY KEY (codigo);


--
-- Name: ordentrabajo ordentrabajo_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.ordentrabajo
    ADD CONSTRAINT ordentrabajo_pkey PRIMARY KEY (codigo);


--
-- Name: permiso_modulo permiso_modulo_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.permiso_modulo
    ADD CONSTRAINT permiso_modulo_pkey PRIMARY KEY (id);


--
-- Name: privilegio privilegio_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.privilegio
    ADD CONSTRAINT privilegio_pkey PRIMARY KEY (codigo);


--
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (codigo);


--
-- Name: proveedor proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.proveedor
    ADD CONSTRAINT proveedor_pkey PRIMARY KEY (codigo);


--
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (codigo);


--
-- Name: rol_privilegio rol_privilegio_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.rol_privilegio
    ADD CONSTRAINT rol_privilegio_pkey PRIMARY KEY (id_rol, id_privilegio);


--
-- Name: seguimiento seguimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.seguimiento
    ADD CONSTRAINT seguimiento_pkey PRIMARY KEY (codigo);


--
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (codigo);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX auth_user_groups_group_id_97559544 ON public.auth_user_groups USING btree (group_id);


--
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON public.auth_user_groups USING btree (user_id);


--
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON public.auth_user_user_permissions USING btree (permission_id);


--
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON public.auth_user_user_permissions USING btree (user_id);


--
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX auth_user_username_6821ab7c_like ON public.auth_user USING btree (username varchar_pattern_ops);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: permiso_modulo_unique_idx; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE UNIQUE INDEX permiso_modulo_unique_idx ON public.permiso_modulo USING btree (id_rol, codigo_cu, nombre_modulo, accion);


--
-- Name: seguimiento_id_cliente_ddf39782; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX seguimiento_id_cliente_ddf39782 ON public.seguimiento USING btree (id_cliente);


--
-- Name: seguimiento_id_usuario_aeb0ae4c; Type: INDEX; Schema: public; Owner: usuario_taller
--

CREATE INDEX seguimiento_id_usuario_aeb0ae4c ON public.seguimiento USING btree (id_usuario);


--
-- Name: ordentrabajo trg_auditoria_bitacora_orden; Type: TRIGGER; Schema: public; Owner: usuario_taller
--

CREATE TRIGGER trg_auditoria_bitacora_orden AFTER INSERT OR UPDATE ON public.ordentrabajo FOR EACH ROW EXECUTE FUNCTION public.tf_auditoria_bitacora_orden();


--
-- Name: ordentrabajo trg_auditoria_estado; Type: TRIGGER; Schema: public; Owner: usuario_taller
--

CREATE TRIGGER trg_auditoria_estado AFTER UPDATE OF estado ON public.ordentrabajo FOR EACH ROW EXECUTE FUNCTION public.tf_auditoria_estado_orden();


--
-- Name: detallecompra trg_aumentar_stock; Type: TRIGGER; Schema: public; Owner: usuario_taller
--

CREATE TRIGGER trg_aumentar_stock AFTER INSERT ON public.detallecompra FOR EACH ROW EXECUTE FUNCTION public.tf_aumentar_stock();


--
-- Name: detalleordentrabajo trg_disminuir_stock; Type: TRIGGER; Schema: public; Owner: usuario_taller
--

CREATE TRIGGER trg_disminuir_stock AFTER INSERT ON public.detalleordentrabajo FOR EACH ROW EXECUTE FUNCTION public.tf_disminuir_stock();


--
-- Name: notaservicio trg_generar_factura_legal; Type: TRIGGER; Schema: public; Owner: usuario_taller
--

CREATE TRIGGER trg_generar_factura_legal AFTER INSERT ON public.notaservicio FOR EACH ROW EXECUTE FUNCTION public.tf_generar_factura_legal();


--
-- Name: detalleordentrabajo trg_precio_cero_cliente; Type: TRIGGER; Schema: public; Owner: usuario_taller
--

CREATE TRIGGER trg_precio_cero_cliente BEFORE INSERT OR UPDATE ON public.detalleordentrabajo FOR EACH ROW EXECUTE FUNCTION public.tf_precio_cero_cliente();


--
-- Name: detallecompra trg_totales_compra; Type: TRIGGER; Schema: public; Owner: usuario_taller
--

CREATE TRIGGER trg_totales_compra AFTER INSERT OR DELETE OR UPDATE ON public.detallecompra FOR EACH ROW EXECUTE FUNCTION public.tf_totales_compra();


--
-- Name: detallecotizacion trg_totales_cotizacion; Type: TRIGGER; Schema: public; Owner: usuario_taller
--

CREATE TRIGGER trg_totales_cotizacion AFTER INSERT OR DELETE OR UPDATE ON public.detallecotizacion FOR EACH ROW EXECUTE FUNCTION public.tf_totales_cotizacion();


--
-- Name: detalleordentrabajo trg_totales_orden; Type: TRIGGER; Schema: public; Owner: usuario_taller
--

CREATE TRIGGER trg_totales_orden AFTER INSERT OR DELETE OR UPDATE ON public.detalleordentrabajo FOR EACH ROW EXECUTE FUNCTION public.tf_totales_orden();


--
-- Name: cotizacion trg_verificar_caducidad; Type: TRIGGER; Schema: public; Owner: usuario_taller
--

CREATE TRIGGER trg_verificar_caducidad BEFORE UPDATE ON public.cotizacion FOR EACH ROW EXECUTE FUNCTION public.tf_verificar_caducidad();


--
-- Name: detalleordentrabajo trg_verificar_stock; Type: TRIGGER; Schema: public; Owner: usuario_taller
--

CREATE TRIGGER trg_verificar_stock BEFORE INSERT ON public.detalleordentrabajo FOR EACH ROW EXECUTE FUNCTION public.tf_verificar_stock();


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: bitacora bitacora_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.bitacora
    ADD CONSTRAINT bitacora_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(codigo);


--
-- Name: compra compra_id_proveedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES public.proveedor(codigo);


--
-- Name: cotizacion cotizacion_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.cotizacion
    ADD CONSTRAINT cotizacion_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.cliente(codigo);


--
-- Name: cotizacion cotizacion_id_motocicleta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.cotizacion
    ADD CONSTRAINT cotizacion_id_motocicleta_fkey FOREIGN KEY (id_motocicleta) REFERENCES public.motocicleta(codigo);


--
-- Name: detallecompra detallecompra_id_compra_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.detallecompra
    ADD CONSTRAINT detallecompra_id_compra_fkey FOREIGN KEY (id_compra) REFERENCES public.compra(codigo) ON DELETE CASCADE;


--
-- Name: detallecompra detallecompra_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.detallecompra
    ADD CONSTRAINT detallecompra_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(codigo);


--
-- Name: detallecotizacion detallecotizacion_id_cotizacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.detallecotizacion
    ADD CONSTRAINT detallecotizacion_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizacion(codigo) ON DELETE CASCADE;


--
-- Name: detalleordentrabajo detalleordentrabajo_id_orden_trabajo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.detalleordentrabajo
    ADD CONSTRAINT detalleordentrabajo_id_orden_trabajo_fkey FOREIGN KEY (id_orden_trabajo) REFERENCES public.ordentrabajo(codigo) ON DELETE CASCADE;


--
-- Name: detalleordentrabajo detalleordentrabajo_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.detalleordentrabajo
    ADD CONSTRAINT detalleordentrabajo_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(codigo);


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: factura factura_id_nota_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_id_nota_servicio_fkey FOREIGN KEY (id_nota_servicio) REFERENCES public.notaservicio(codigo);


--
-- Name: motocicleta motocicleta_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.motocicleta
    ADD CONSTRAINT motocicleta_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.cliente(codigo) ON DELETE CASCADE;


--
-- Name: notaservicio notaservicio_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.notaservicio
    ADD CONSTRAINT notaservicio_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.cliente(codigo);


--
-- Name: notaservicio notaservicio_id_orden_trabajo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.notaservicio
    ADD CONSTRAINT notaservicio_id_orden_trabajo_fkey FOREIGN KEY (id_orden_trabajo) REFERENCES public.ordentrabajo(codigo);


--
-- Name: notatrabajo notatrabajo_id_mecanico_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.notatrabajo
    ADD CONSTRAINT notatrabajo_id_mecanico_fkey FOREIGN KEY (id_mecanico) REFERENCES public.usuario(codigo);


--
-- Name: notatrabajo notatrabajo_id_orden_trabajo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.notatrabajo
    ADD CONSTRAINT notatrabajo_id_orden_trabajo_fkey FOREIGN KEY (id_orden_trabajo) REFERENCES public.ordentrabajo(codigo) ON DELETE CASCADE;


--
-- Name: ordentrabajo ordentrabajo_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.ordentrabajo
    ADD CONSTRAINT ordentrabajo_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.cliente(codigo);


--
-- Name: ordentrabajo ordentrabajo_id_cotizacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.ordentrabajo
    ADD CONSTRAINT ordentrabajo_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizacion(codigo);


--
-- Name: ordentrabajo ordentrabajo_id_mecanico_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.ordentrabajo
    ADD CONSTRAINT ordentrabajo_id_mecanico_fkey FOREIGN KEY (id_mecanico) REFERENCES public.usuario(codigo);


--
-- Name: ordentrabajo ordentrabajo_id_motocicleta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.ordentrabajo
    ADD CONSTRAINT ordentrabajo_id_motocicleta_fkey FOREIGN KEY (id_motocicleta) REFERENCES public.motocicleta(codigo);


--
-- Name: permiso_modulo permiso_modulo_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.permiso_modulo
    ADD CONSTRAINT permiso_modulo_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.rol(codigo);


--
-- Name: rol_privilegio rol_privilegio_id_privilegio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.rol_privilegio
    ADD CONSTRAINT rol_privilegio_id_privilegio_fkey FOREIGN KEY (id_privilegio) REFERENCES public.privilegio(codigo) ON DELETE CASCADE;


--
-- Name: rol_privilegio rol_privilegio_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.rol_privilegio
    ADD CONSTRAINT rol_privilegio_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.rol(codigo) ON DELETE CASCADE;


--
-- Name: seguimiento seguimiento_id_cliente_ddf39782_fk_cliente_codigo; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.seguimiento
    ADD CONSTRAINT seguimiento_id_cliente_ddf39782_fk_cliente_codigo FOREIGN KEY (id_cliente) REFERENCES public.cliente(codigo) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: seguimiento seguimiento_id_usuario_aeb0ae4c_fk_usuario_codigo; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.seguimiento
    ADD CONSTRAINT seguimiento_id_usuario_aeb0ae4c_fk_usuario_codigo FOREIGN KEY (id_usuario) REFERENCES public.usuario(codigo) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: usuario usuario_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: usuario_taller
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.rol(codigo);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: usuario_taller
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict WmM0V1rIT6QtZIcdVPqtVC9bYf59N4ew8Up3uMyIoIXdppebXDKs16u73AcSTlq

