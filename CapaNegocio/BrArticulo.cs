﻿using CapaDao;
using Entidades;
using Helper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using System.Text.Json.Serialization;
namespace CapaNegocio
{
    public class BrArticulo
    {
        private DaoArticulo _dao = null;
        private ResultadoOperacion _resultado = null;
        private IConfiguration _configuration = null;
        private IWebHostEnvironment _environment = null;

        public BrArticulo(IConfiguration configuration, IWebHostEnvironment environment)
        {
            _dao = new DaoArticulo();
            _resultado = new ResultadoOperacion();
            _environment = environment;
            _configuration = configuration;
        }

        public ResultadoOperacion listaArticulos(string accion, string idSucursal, string tipoFiltro, string filtro)
        {
            using (SqlConnection con = new SqlConnection(Conexion.sConexion))
            {
                try
                {
                    con.Open();
                    var lista = _dao.listaArticulos(con, accion, idSucursal, tipoFiltro, filtro);

                    if (lista != null)
                    {
                        string dominioWeb = Configuraciones.DOMINIO_WEB_API;
                        string upLoadArticulos = Configuraciones.UPLOAD_ARTICULOS;
                        //Foto1: Tamaño grande, utilizada para la vista previa
                        //Foto2: Tamaño pequeño, es la que se mostrará en el mantemimiento. Si no existe foto2, tomará la foto1 en caso exisitiera. 
                        lista.ForEach(x =>
                        {
                            //Uri relativa de foto mas pequeña que se utilizará para el mantenimiento del artículo.
                            if (!string.IsNullOrEmpty(x.FOTO1) && !string.IsNullOrEmpty(x.FOTO2))
                            {
                                x.FOTO1 = Path.Combine(dominioWeb, upLoadArticulos, x.FOTO1);
                                x.FOTO2 = Path.Combine(dominioWeb, upLoadArticulos, x.FOTO2);
                            }
                            else if (!string.IsNullOrEmpty(x.FOTO1) && string.IsNullOrEmpty(x.FOTO2))
                            {
                                x.FOTO1 = Path.Combine(dominioWeb, upLoadArticulos, x.FOTO1);
                                x.FOTO2 = Path.Combine(dominioWeb, upLoadArticulos, x.FOTO1);
                            }
                        });
                    }
                    _resultado.SetResultado(true, "", lista);
                }
                catch (Exception ex)
                {
                    Elog.save(this, ex);
                    _resultado.SetResultado(false, ex.Message);
                }
            }

            return _resultado;
        }

        public ResultadoOperacion listaArticulosGeneral(string accion, string idSucursal, string tipoFiltro, string filtro, ref MONEDA moneda)
        {
            using (SqlConnection con = new SqlConnection(Conexion.sConexion))
            {
                try
                {
                    con.Open();
                    List<ARTICULO> lista = _dao.listaArticulosGeneral(con, accion, idSucursal, tipoFiltro, filtro, ref moneda);

                    if (lista != null)
                    {
                        lista.ForEach(x =>
                        {
                            if (!string.IsNullOrEmpty(x.JSON_UM))
                                x.listaArticuloUm = JsonSerializer.Deserialize<List<ARTICULO_UM>>(x.JSON_UM); 
                        });
                    }

                    _resultado.SetResultado(true, "", lista);

                }
                catch (Exception ex)
                {
                    Elog.save(this, ex);
                    _resultado.SetResultado(false, ex.Message);
                }
            }
            return _resultado;
        }

        public ResultadoOperacion grabarArticulo(ARTICULO oModelo, ref string idArticulo, ref string jsonFotos, ref bool flgMismaFoto)
        {
            SqlTransaction trx = null;
            using (SqlConnection con = new SqlConnection(Conexion.sConexion))
            {
                try
                {
                    con.Open();
                    trx = con.BeginTransaction();

                    //Modificamos al estandar utilizado en BD.
                    if (!string.IsNullOrEmpty(oModelo.JSON_UM))
                    {
                        oModelo.JSON_UM = oModelo.JSON_UM
                            .Replace("idUm", "ID_UM")
                            .Replace("nroFactor", "NRO_FACTOR")
                            .Replace("descuento", "DESCUENTO1")
                            .Replace("flgPromocion", "FLG_PROMOCION")
                            .Replace("fecInicioPromocion", "FEC_INICIO_PROMOCION")
                            .Replace("fecFinalPromocion", "FEC_FINAL_PROMOCION");
                    };

                    _dao.grabarArticulo(con, trx, oModelo, ref idArticulo, ref jsonFotos, ref flgMismaFoto);

                    _resultado.SetResultado(true, Helper.Constantes.sMensajeGrabadoOk);
                    trx.Commit();
                }
                catch (Exception ex)
                {
                    _resultado.SetResultado(false, ex.Message.ToString());
                    trx.Rollback();
                    Elog.save(this, ex);
                }
            }
            return _resultado;
        }

        public ResultadoOperacion anularArticulo(string idArticulo, string idUsuario)
        {
            SqlTransaction trx = null;
            using (SqlConnection con = new SqlConnection(Conexion.sConexion))
            {
                try
                {
                    con.Open();
                    trx = con.BeginTransaction();

                    string jsonFotos = string.Empty;
                    _dao.anularArticulo(con, trx, idArticulo, idUsuario, ref jsonFotos);

                    _resultado.SetResultado(true, Helper.Constantes.sMensajeEliminadoOk, jsonFotos);
                    trx.Commit();
                }
                catch (Exception ex)
                {
                    _resultado.SetResultado(false, ex.Message.ToString());
                    trx.Rollback();
                    Elog.save(this, ex);
                }
            }
            return _resultado;
        }

        public ResultadoOperacion articuloPorCodigo(string idSucursal, string idArticulo)
        {
            using (SqlConnection con = new SqlConnection(Conexion.sConexion))
            {
                try
                {
                    con.Open();
                    ARTICULO modelo = _dao.articuloPorCodigo(con, idSucursal, idArticulo);
                    if (modelo != null)
                    {
                        string dominioWeb = Configuraciones.DOMINIO_WEB_API;
                        string uploadArticulo = Configuraciones.UPLOAD_ARTICULOS;
                        //Foto1: Tamaño grande
                        //Foto2: Tamaño pequeño
                        //En este caso la foto mas pequeña es la que se mostrará en el mantenimiento
                        byte[] binaryFoto = null;

                        if (!string.IsNullOrEmpty(modelo.FOTO1) && !string.IsNullOrEmpty(modelo.FOTO2))
                        {
                            binaryFoto = File.ReadAllBytes(Path.Combine(_environment.WebRootPath, uploadArticulo, modelo.FOTO2));
                            modelo.FOTO_B64 = Convert.ToBase64String(binaryFoto);
                            modelo.FOTO1 = Path.Combine(dominioWeb, uploadArticulo, modelo.FOTO1);
                            modelo.FOTO2 = Path.Combine(dominioWeb, uploadArticulo, modelo.FOTO2);
                        }
                        else if (!string.IsNullOrEmpty(modelo.FOTO1) && string.IsNullOrEmpty(modelo.FOTO2))
                        {
                            binaryFoto = File.ReadAllBytes(Path.Combine(_environment.WebRootPath, uploadArticulo, modelo.FOTO1));
                            modelo.FOTO_B64 = Convert.ToBase64String(binaryFoto);
                            modelo.FOTO1 = Path.Combine(dominioWeb, uploadArticulo, modelo.FOTO1);
                            modelo.FOTO2 = Path.Combine(dominioWeb, uploadArticulo, modelo.FOTO1);
                        }
                    }
                    _resultado.SetResultado(true, "", modelo);
                }
                catch (Exception ex)
                {
                    Elog.save(this, ex);
                    _resultado.SetResultado(false, ex.Message);
                }
            }
            return _resultado;
        }
    }
}
