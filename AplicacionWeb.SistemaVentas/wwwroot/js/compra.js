﻿'use strict'
var oCompra = {
    modeloAbono: null,
    instance: null,
    titulo: "Registro de compra",
    init: function () {
        oCompra.botonera(true);
        oConfigControls.inicializarDatePicker("#txtFecVen, .input-daterange");
        oCompra.initTblConsultarCompra();
        oCompra.inicializarRangoFechas();

        let $txtFecEmi = $("#txtFecEmi").datepicker({
            autoclose: true,
            todayHighlight: true,
            language: 'es' //debes de descargar el nombredelarchivo.es.js, será el encargado de traducirlo en español. 
        });
        $txtFecEmi.prev().on('click', function () {
            $(this).next().focus();
        });
        $txtFecEmi.on('change', function (e) {
            $('#txtFecVen').datepicker('update', e.target.value);
        });

        let txtIgv = document.getElementById('txtIgv');
        txtIgv.addEventListener('keypress', (e) => oHelper.soloNumerosEnteros(e));
        txtIgv.addEventListener('blur', (e) => {
            let txt = e.target;
            if (txt.value == "")
                txt.value = document.getElementById('hddIgv').value;
        })

        let txtSerie = document.getElementById('txtSerie');
        txtSerie.addEventListener('keyup', (e) => oHelper.teclaEnter(e, "txtNumero"));
        txtSerie.addEventListener('input', (e) => oHelper.mayus(e.target));

        let txtNumero = document.getElementById('txtNumero');
        txtNumero.addEventListener('keyup', (e) => oHelper.teclaEnter(e, "txtFecEmi"));
        txtNumero.addEventListener('keypress', (e) => oHelper.soloNumerosEnteros(e));

        let txtFecEmi = document.getElementById('txtFecEmi');
        txtFecEmi.addEventListener('keyup', (e) => oHelper.teclaEnter(e, "txtFecVen"));

        let txtNumDoc = document.getElementById('txtNumDoc');
        txtNumDoc.addEventListener('keypress', (e) => oHelper.soloNumerosEnteros(e));
        txtNumDoc.addEventListener('keyup', (e) => {
            if (e.key == "Enter")
                oCompra.obtenerProveedorPorDocumento();
        });

        let txtNumDocConsulta = document.getElementById('txtNumDocConsulta');
        txtNumDocConsulta.addEventListener('keypress', (e) => oHelper.soloNumerosEnteros(e));
        txtNumDocConsulta.addEventListener('keyup', (e) => {
            if (e.key == "Enter")
                oCompra.obtenerProveedorPorDocumentoConsulta();
        });

        document.getElementById('cboTipDoc').addEventListener('change', (e) => {
            let cbo = e.target;
            oCompra.inicializarDatosProveedor(cbo);
        });

        document.getElementById('cboTipDocConsulta').addEventListener('change', (e) => {
            let cbo = e.target;

            if (cbo.value == "")
                oCompra.inicializarDatosProveedorConsulta(true);
            else
                oCompra.inicializarDatosProveedorConsulta(false);
        });

        let txtSerieConsulta = document.getElementById('txtSerieConsulta');
        txtSerieConsulta.addEventListener('keyup', (e) => oHelper.teclaEnter(e, "txtNumeroConsulta"));

        let txtNumeroConsulta = document.getElementById('txtNumeroConsulta');
        txtNumeroConsulta.addEventListener('keypress', (e) => oHelper.soloNumerosEnteros(e));

        document.getElementById('cboTipCom').addEventListener('change', (e) => {
            let cbo = e.target;

            if (cbo.value == "")
                return;

            let nomTipCom = cbo.options[cbo.selectedIndex].text;
            let cboTipDoc = document.getElementById('cboTipDoc');

            //Habilitamos solo los documentos según el comprobante seleccionado.
            Array.from(cboTipDoc.querySelectorAll("option")).forEach(opt => {
                opt.disabled = true;

                if (opt.value != "") {
                    //Si es factura entonces se habilitaran solo los documento con el flagRuc.
                    if (nomTipCom.slice(0, 3).toUpperCase() == "FAC") {
                        let flgRuc = opt.getAttribute("data-flgruc") == "True" ? true : false;
                        if (flgRuc) {
                            opt.disabled = false;
                            opt.selected = true;
                        }
                    } else {
                        opt.disabled = false;
                    }
                } else {
                    opt.disabled = false;
                }
            });

            if (nomTipCom.slice(0, 3).toUpperCase() == "FAC" && cboTipDoc.value != "") {
                let flgRuc = cboTipDoc.options[cboTipDoc.selectedIndex].getAttribute("data-flgruc") == "True" ? true : false;
                //Si es ruc(es una ayuda), inicializamos los controles del proveedor. 
                if (flgRuc)
                    oCompra.inicializarDatosProveedor(cboTipDoc);
                else
                    oCompra.limpiarProveedor(true);
            };

            document.getElementById('txtSerie').focus();
        });

        document.getElementById('cboTipComConsulta').addEventListener('change', (e) => {
            let cbo = e.target;

            if (cbo.value == "") {
                oCompra.inicializarDatosComprobanteConsulta(true);
            } else {
                oCompra.inicializarDatosComprobanteConsulta(false);
                txtSerieConsulta.focus();
            }
        });

        document.getElementById('btnBusPorNum').addEventListener('click', oCompra.obtenerProveedorPorDocumento);
        document.getElementById('btnBusPorNumConsulta').addEventListener('click', oCompra.obtenerProveedorPorDocumentoConsulta);
        document.getElementById('btnBusPorCodBar').addEventListener('click', oCompra.obtenerArticuloPorCodigoBarra);

        let txtCodBar = document.getElementById('txtCodBar');
        txtCodBar.addEventListener('input', (e) => {
            if (e.target.value.length > 0) {
                document.getElementById('btnLimCodBar').style.display = "block";
            } else {
                document.getElementById('btnLimCodBar').style.display = "none";
            }
        });
        txtCodBar.addEventListener('keyup', (e) => {
            if (e.key == "Enter")
                oCompra.obtenerArticuloPorCodigoBarra();
        });
        txtCodBar.addEventListener('keypress', (e) => oHelper.soloNumerosEnteros(e));

        document.getElementById('btnLimCodBar').addEventListener('click', (e) => {
            e.currentTarget.style.display = "none";
            let txtCodBar = document.getElementById('txtCodBar');
            txtCodBar.value = "";
            txtCodBar.focus();
        });

        $("#tblDetalle").find("tbody").on("change", "td select", (e) => {
            let cbo = e.target;
            let row = cbo.parentElement.parentElement;
            let cells = row.cells;

            let nroFactor = "";
            if (cbo.value != "")
                nroFactor = cbo.options[cbo.selectedIndex].getAttribute('data-nroFactor');

            cells[3].textContent = nroFactor;
            cells[4].children[0].focus();

        });

        $("#tblDetalle").find("tbody").on("keypress", "td input[type=text], td input[type=number]", (e) => {
            let input = e.target;
            let td = input.parentElement;
            if (td.cellIndex == 4 || td.cellIndex == 5 || td.cellIndex == 7) {
                oHelper.numerosDecimales(e);
            } else if (td.cellIndex == 6) {
                oHelper.soloNumerosEnteros(e);
            }
        });

        $("#tblDetalle").find("tbody").on("keyup", "td input[type=number], td input[type=text]", (e) => {
            let input = e.target;
            let td = input.parentElement;
            let cells = td.parentElement.cells;

            if (td.cellIndex == 4 && e.key == "Enter") {
                cells[5].children[0].focus();
            } else if (td.cellIndex == 5 && e.key == "Enter") {
                cells[6].children[0].focus();
            } else if (td.cellIndex == 6 && e.key == "Enter") {
                cells[7].children[0].focus();
            }
        });

        $("#tblDetalle").find("tbody").on("input", "td input[type=number], td input[type=text]", (e) => {
            let input = e.target;
            let td = input.parentElement;
            let cells = td.parentElement.cells;

            let precio = cells[4].children[0].value == '' ? 0 : parseFloat(cells[4].children[0].value);
            let cantidad = cells[5].children[0].value == '' ? 0 : parseFloat(cells[5].children[0].value);
            let descuento = cells[6].children[0].value == '' ? 0 : parseFloat(cells[6].children[0].value);
            let importe = cells[7].children[0].value == '' ? 0 : parseFloat(cells[7].children[0].value);

            //Editando el precio
            if (td.cellIndex == 4) {
                precio = new Decimal(precio);
                let precioBruto = precio.times(cantidad);
                let montoDscto = precioBruto.times((descuento / 100));
                cells[7].children[0].value = precioBruto.minus(montoDscto).toNumber().toFixed(2);

                //Editando el importe
            } else if (td.cellIndex == 7) {
                let importeSinDscto = 0;
                let porcMaximo = new Decimal(100);
                let porcVendido = porcMaximo.minus(descuento).toNumber();

                if (porcVendido > 0) {
                    //Hallamos el importe sin descuento con la regla de 3 simple.
                    importeSinDscto = new Decimal(porcMaximo.times(importe).dividedBy(porcVendido).toNumber());

                    //Hallamos el precio UM
                    if (cantidad > 0)
                        cells[4].children[0].value = importeSinDscto.dividedBy(cantidad).toNumber().toFixed(2);
                    else
                        cells[4].children[0].value = 0;

                } else {
                    cells[7].children[0].value = 0;
                }

                //Editando la cantidad o descuento
            } else {
                //Controlamos para que no se ingrese mayor a 100
                if (td.cellIndex == 6) {
                    let dscto = input.value;
                    if (!!dscto) {
                        //Esto es solo porque a veces estando el numero 100 y apretamos una tecla numerica
                        if (dscto.length == 4) {
                            dscto = dscto.slice(0, 3);
                        } else {
                            if (dscto > 100)
                                dscto = dscto.slice(0, 2);
                        }
                        descuento = dscto;
                        input.value = descuento == 0 ? '' : descuento;
                    }
                }

                if (precio > 0) {
                    precio = new Decimal(precio);
                    let precioBruto = precio.times(cantidad);
                    let montoDscto = precioBruto.times((descuento / 100));
                    cells[7].children[0].value = precioBruto.minus(montoDscto).toNumber().toFixed(2);
                } else {
                    let importeSinDscto = 0;
                    let porcMaximo = new Decimal(100);
                    let porcVendido = porcMaximo.minus(descuento).toNumber();

                    if (porcVendido > 0) {
                        //Hallamos el importe sin descuento con la regla de 3 simple.
                        importeSinDscto = new Decimal(porcMaximo.times(importe).dividedBy(porcVendido).toNumber());

                        //Hallamos el precio UM
                        if (cantidad > 0)
                            cells[4].children[0].value = importeSinDscto.dividedBy(cantidad).toNumber().toFixed(2);
                        else
                            cells[4].children[0].value = 0;

                    } else {
                        cells[7].children[0].value = 0;
                    }
                }
            }
            oCompra.calcularTotales();
        });

        $("#tblDetalle").find("tbody").on("click", "td button", (e) => {
            let button = e.currentTarget;
            let row = button.parentElement.parentElement;
            document.getElementById("tblDetalle").deleteRow(row.rowIndex);

            oCompra.calcularTotales();
        });

        let txtTasDes = document.getElementById('txtTasDes');
        txtTasDes.addEventListener('keypress', (e) => oHelper.soloNumerosEnteros(e));
        txtTasDes.addEventListener('input', (e) => {
            let input = e.target;
            //Controlamos para que no se ingrese mayor a 100
            let dscto = input.value;

            if (!!dscto) {
                //Esto es solo porque a veces estando el numero 100 y apretamos una tecla numerica
                if (dscto.length == 4) {
                    dscto = dscto.slice(0, 3);
                } else {
                    if (dscto > 100)
                        dscto = dscto.slice(0, 2);
                }
                input.value = dscto == 0 ? '' : dscto;
            }
            oCompra.calcularTotales();
        });

        document.getElementById('cboForPag').addEventListener('change', (e) => oCompra.seleccionarFormaPago(e));

        document.getElementById('btnEditarAbono').addEventListener('click', () => {
            let flgEditar = true;
            oModalAbono.show(oCompra.modeloAbono, flgEditar).then(response => {
                oCompra.bindingAbono(response);
            }).catch((editar) => { });
        });

        oCompra.limpiarTotales();

        oCompra.limpiarAbono();

        document.getElementById('btnConPro').addEventListener('click', (e) => {
            //Abrir modal de consulta de proveedores.
            oModalConsultarProveedor.show().then(response => {
                oCompra.bindingProveedor(response);
            }).catch(error => { });
        });

        document.getElementById('btnNuePro').addEventListener('click', (e) => {
            //Abrir modal de registro de proveedores.
            oModalRegistrarProveedor.show().then(response => {
                oCompra.bindingProveedor(response);
            }).catch(error => { });
        });

        document.getElementById('btnConProConsulta').addEventListener('click', (e) => {
            oModalConsultarProveedor.show().then(response => {
                oCompra.bindingProveedorConsulta(response);
            }).catch(error => {
            });
        });

        document.getElementById('btnAgrArt').addEventListener('click', () => {
            oModalConsultarArticulo.show((modelo) => {
                //Agregamos el artículo encontrado al detalle.
                oCompra.agregarArticulo(modelo).then(() => {

                }).catch(error => {
                    oAlerta.show({
                        message: error,
                        type: "warning"
                    });
                });
            }, document.getElementById('tblDetalle'));
        });

        document.getElementById('btnNuevo').addEventListener('click', oCompra.nuevo);
        document.getElementById('btnGrabar').addEventListener('click', () => {
            //Validamos los datos
            oCompra.validarForm().then((result) => {
                //Si tiene caja abierta y monto total en caja > 0, entonces mostrará el modal 
                //preguntando si desea retirar dinero de caja.
                if (oModalCajaApertura.bCajaAbierta) {

                    //Traemos el monto total de caja en tiempo real(no signalr).
                    oHelper.showLoading();
                    let uri = `/CajaApertura/GetTotalsByUserId/${oModalCajaApertura.modelo.idCaja}/${oModalCajaApertura.modelo.correlativo}`;
                    axios.get(uri).then((response) => {
                        let data = response.data.Data;
                        if (data.MontoTotal > 0) {

                            //Mostramos el modal de pregunta "¿deseamos retirar dinero de caja?", en caso si, entonces ingresamos la cantidad a retirar.
                            oModalPagarCompra.show({
                                sgnMoneda: oCompra.getSgnMoneda(),
                                montoTotalCaja: data.MontoTotal,
                                esAcredito: oCompra.esAcredito(),
                                montoCompra: oCompra.esAcredito() ? (oCompra.modeloAbono != null ? oCompra.modeloAbono.abono : 0) : oHelper.numeroSinMoneda(document.getElementById('lblTotPag').textContent)
                            }).then((modelo) => {
                                //Obtenemos el monto ingresado en el modal.
                                result = Object.assign(result, {
                                    flgRetirarCaja: modelo.bRetirarDinero,
                                    montoRetiraCaja: modelo.montoRetiro,
                                    idCaja: oModalCajaApertura.modelo.idCaja,
                                    correlativoCa: oModalCajaApertura.modelo.correlativo
                                })

                                //Realizamos el guardado de la compra.
                                oCompra.grabar(result);
                            }).catch(() => { });
                        }
                    }).catch((error) => {
                        const data = error.response.data;
                        oAlerta.show({
                            message: data.errorDetails.message,
                            type: "warning"
                        });
                    }).finally(() => oHelper.hideLoading());

                } else {
                    //Si no existe caja abierta, realizamos el guardado de la compra.
                    oCompra.grabar(result);
                }
            }).catch(error => {
                oAlerta.show({
                    message: error,
                    type: "warning"
                });
            })
        });
        document.getElementById('btnAnular').addEventListener('click', () => {
            oAlertaModal.showConfirmation({
                title: oCompra.titulo,
                message: "¿Desea anular el registro seleccionado?",
                size: "",
                showCheckOptional: true,
                messageCheckOptional: "Utilizar de modelo este registro para registrar nueva compra."
            }).then((okResponse) => {
                let crearCopia = okResponse.checkOptional;

                oHelper.showLoading();

                let parameters = {
                    IdTipoComprobante: document.getElementById('cboTipCom').value,
                    NroSerie: document.getElementById('txtSerie').value,
                    NroDocumento: document.getElementById('txtNumero').value,
                    IdProveedor: document.getElementById('hddIdPro').value
                };

                axios.post("/Compra/Delete", parameters).then((response) => {
                    let data = response.data;

                    //Si hemos marcado la opción de crear copia solo se desabilitará los elementos desabilitados.
                    if (crearCopia) {
                        oCompra.botonera(true);
                        oCompra.desabilitar(false);
                        document.getElementById('spnEstado').textContent = "";
                    } else {
                        oCompra.nuevo();
                    }

                    //Incializamos la pestaña consulta
                    oCompra.inicializarPestaniaConsulta();

                    oAlerta.show({
                        message: data.Mensaje,
                        type: "success"
                    });
                }).catch((error) => {
                    const data = error.response.data;
                    oAlerta.show({
                        message: data.errorDetails.message,
                        type: "warning"
                    });
                }).finally(() => oHelper.hideLoading());
            }).catch((cancelar) => {

            })
        });

        let options = {

        };
        let modal = document.getElementById('modalConsultarCompra')
        oCompra.instance = new bootstrap.Modal(modal, options)

        modal.addEventListener('shown.bs.modal', function () {

        });
        modal.addEventListener('hidden.bs.modal', function () {
          
        });

        document.getElementById('btnBuscar').addEventListener('click', () => {
            oCompra.instance.show();
        });

        //// consulta
        document.getElementById('filtroProveedor').style.display = "none";
        document.getElementById('filtroComprobante').style.display = "none";
        document.getElementById('filtroFechas').style.display = "flex";

        Array.from(modal.querySelectorAll('input[type=radio][name="flexRadioDefault"]')).forEach(rb => {
            rb.addEventListener('change', (e) => oCompra.seleccionarPorTipoDeFiltroEnConsulta(e.target.id));
        });

        document.getElementById('btnBuscarComprobantes').addEventListener('click', oCompra.consultar);

        $("#tblConsultarCompra").find("tbody").on("click", "td button", (e) => {
            let button = e.currentTarget;
            let row = button.parentElement.parentElement;

            oCompra.obtenerCompraPorCodigo({
                idTipoComprobante: row.cells[8].textContent,
                nroSerie: row.cells[9].textContent,
                nroDocumento: row.cells[10].textContent,
                idProveedor: row.cells[11].textContent,
            })

        });

        window.addEventListener('keydown', (e) => {
            if (e.key == "+") {
                oModalConsultarArticulo.show((modelo) => {
                    //Agregamos el artículo encontrado al detalle.
                    oCompra.agregarArticulo(modelo).then(() => {}).catch(error => {
                        oAlerta.show({
                            message: error,
                            type: "warning"
                        });
                    });
                }, document.getElementById('tblDetalle'));
            }
        })
    },
    inicializarPestaniaConsulta() {
        //Incializamos los elementos y tabla de la pestaña consulta.
        let rb = document.getElementById('rbPorFechas');
        rb.checked = true;
        oCompra.seleccionarPorTipoDeFiltroEnConsulta(rb.id);
        oCompra.cleartblConsultarCompra();
    },
    seleccionarPorTipoDeFiltroEnConsulta(idTipoFiltro) {
        switch (idTipoFiltro) {
            case "rbPorProveedor":
                document.getElementById('filtroProveedor').style.display = "flex";
                document.getElementById('filtroComprobante').style.display = "none";
                oCompra.inicializarDatosComprobanteConsulta(true);
                break;
            case "rbPorComprobante":
                document.getElementById('filtroProveedor').style.display = "none";
                document.getElementById('filtroComprobante').style.display = "flex";
                oCompra.inicializarDatosProveedorConsulta(true);
                break;
            case "rbPorFechas":
                document.getElementById('filtroFechas').display = "flex";
                document.getElementById('filtroProveedor').style.display = "none";
                document.getElementById('filtroComprobante').style.display = "none";
                oCompra.inicializarDatosProveedorConsulta(true);
                oCompra.inicializarDatosComprobanteConsulta(true);
                break;
        }
    },
    cleartblConsultarCompra: function () {
        let tblConsultarCompra = $("#tblConsultarCompra").DataTable();
        if (tblConsultarCompra != null) {
            tblConsultarCompra.rows().remove().draw();
            tblConsultarCompra.destroy();
        }
    },
    obtenerCompraPorCodigo: function (comprobante) {
        oHelper.showLoading();

        let table = document.getElementById('tblDetalle');

        oHelper.limpiarTabla(table);

        let parameters = `${comprobante.idTipoComprobante}/${comprobante.nroSerie}/${comprobante.nroDocumento}/${comprobante.idProveedor}`;

        axios.get(`/Compra/GetById/${parameters}`).then(response => {
            const result = response.data;
            let data = result.data;
            let cabecera = data.cabecera;
            let detalle = data.detalle;

            //Binding
            //Cabecera
            document.getElementById('cboTipCom').value = cabecera.idTipoComprobante;
            document.getElementById('txtSerie').value = cabecera.nroSerie;
            document.getElementById('txtNumero').value = cabecera.nroDocumento;

            $("#txtFecEmi").datepicker('update', cabecera.fecDocumento);
            $('#txtFecVen').datepicker('update', cabecera.fecVencimiento);

            document.getElementById('cboTipDoc').value = cabecera.idTipoDocumento;
            document.getElementById('hddIdPro').value = cabecera.idProveedor;
            document.getElementById('txtNumDoc').value = cabecera.nroDocumentoProveedor;
            document.getElementById('txtRazSoc').value = cabecera.nomProveedor;

            document.getElementById('txtIgv').value = cabecera.tasIgv;

            document.getElementById('cboTipPag').value = cabecera.idTipoPago;
            document.getElementById('cboForPag').value = cabecera.idTipoCondicion;
            document.getElementById('txtObservacion').value = cabecera.observacion;

            document.getElementById('lblSubTot').textContent = oHelper.formatoMiles(cabecera.totBruto);
            document.getElementById('lblTotDes').textContent = oHelper.formatoMiles(cabecera.totDescuento);
            document.getElementById('lblTotIgv').textContent = oHelper.formatoMiles(cabecera.totImpuesto);
            document.getElementById('lblTotal').textContent = oHelper.formatoMiles(cabecera.totCompra);

            document.getElementById('lblTotRed').textContent = (parseFloat(cabecera.totCompra) - parseFloat(cabecera.totCompraRedondeo)).toFixed(2);
            document.getElementById('lblTotPag').textContent = oHelper.formatoMoneda(oCompra.getSgnMoneda(), cabecera.totCompraRedondeo, 2);
            document.getElementById('txtTasDes').value = cabecera.tasDescuento;

            let spnEstado = document.getElementById('spnEstado');
            if (cabecera.estDocumento == 1) {
                spnEstado.classList.remove("bg-danger");
                spnEstado.classList.add("bg-success");

            } else if (cabecera.estDocumento == 3) {
                spnEstado.classList.remove("bg-success");
                spnEstado.classList.add("bg-danger");

            };
            spnEstado.textContent = cabecera.nomEstado;
            spnEstado.setAttribute("data-idEstado", cabecera.estDocumento);

            //Detalle
            let tbody = table.getElementsByTagName('tbody')[0];
            let frag = document.createDocumentFragment();

            detalle.forEach(x => {
                let tr = document.createElement('tr');

                let option = '<option value>---Seleccione---</option>';
                x.jsonListaUm.forEach(y => {
                    option += `<option value="${y.idUm}" ${y.idUm == x.idUm ? 'selected' : ''} data-nroFactor="${y.NroFactor}">${y.nomUm.capitalizeAll()}</option>`
                });

                let cboUm = `<select class="form-select form-select-sm">${option}</select>`;

                let txtPrecio = `<input class="form-control form-control-sm text-end" type="text" style="width:80px" value="${parseFloat(x.precioArticulo).toFixed(2)}"/>`;
                let txtCantidad = `<input class="form-control form-control-sm text-end" type="text" value="${x.cantidad}" style="width:80px"/>`;
                let txtDescuento = `<input class="form-control form-control-sm text-end" type="number" min="0" max="100" step="5" value="${x.tasDescuento}" style="width:80px"/>`;
                let txtImporte = `<input class="form-control form-control-sm text-end" type="text" style="width:100px" value="${parseFloat(x.importe).toFixed(2)}"/>`;

                let td = `<td>${x.codigo}</td>
                    <td>${x.nomArticulo}</td>
                    <td>${cboUm}</td>
                    <td class='text-end'>${x.nroFactor}</td>
                    <td class='text-end'>${txtPrecio}</td>
                    <td>${txtCantidad}</td>
                    <td>${txtDescuento}</td>
                    <td>${txtImporte}</td>
                    <td><button type="button" class="btn btn-danger btn-sm" ><i class="bi bi-trash-fill"></i></button></td>
                    <td class='d-none'>${x.idArticulo}</td>`;

                tr.innerHTML = td;
                frag.appendChild(tr);
            });
            tbody.appendChild(frag);

            oCompra.desabilitar(true);

            oCompra.botonera(false);

            oCompra.instance.hide();

        }).catch(error => {
            const data = error.response.data;
            oAlerta.show({
                message: data.errorDetails.message,
                type: "warning"
            });
        }).finally(() => {
            oHelper.hideLoading();
        });
    },
    consultar: function () {
        let table = document.getElementById('tblConsultarCompra');
        let tbody = table.getElementsByTagName('tbody')[0];

        //Limpiamos la tabla
        oCompra.cleartblConsultarCompra();

        oHelper.showLoading("#modalConsultarCompra");
        let parameters = {
            params: {
                idTipoComprobante: document.getElementById('cboTipComConsulta').value,
                nroSerie: document.getElementById('txtSerieConsulta').value,
                nroDocumento: document.getElementById('txtNumeroConsulta').value == '' ? 0 : document.getElementById('txtSerieConsulta').value,
                idProveedor: document.getElementById('hddIdProConsulta').value,
                fechaInicial: document.getElementById('txtRanFecIni').value,
                fechaFinal: document.getElementById('txtRanFecFin').value,
                idEstado: document.getElementById('cboEstadoConsulta').value,
            }
        }
        axios.get("/Compra/GetAll", parameters).then(response => {
            const result = response.data;
            const listArticulo = result;

            let frag = document.createDocumentFragment();
            listArticulo.forEach(x => {
                let td = `<td class="py-1"><button type="button" class="btn btn-sm warning-intenso"><i class="bi bi-hand-index-fill" style='color:#fff'></i></button></td>
                        <td>${x.comprobante}</td>
                        <td>${x.docProveedor}</td>
                        <td>${x.nomProveedor}</td>
                        <td class='text-end'>${oHelper.formatoMoneda(x.sgnMoneda, x.totCompra, 2)}</td>
                        <td class='text-end'>${x.fecDocumento}</td>
                        <td><span class="badge rounded-pill bg-${(x.flgEvaluaCredito ? 'warning' : 'primary')} ">${x.nomTipoCondicionPago}</span></td>
                        <td><span class="badge rounded-pill bg-${(x.estDocumento == 1 ? 'success' : 'danger')} ">${x.nomEstado}</span></td>
                        <td class='d-none' >${x.idTipoComprobante}</td>
                        <td class='d-none' >${x.nroSerie}</td>
                        <td class='d-none'>${x.nroDocumento}</td>
                        <td class='d-none' >${x.idProveedor}</td>`;

                let tr = document.createElement('tr');
                tr.innerHTML = td
                frag.appendChild(tr);
            });
            tbody.appendChild(frag);
        }).catch(error => {
            const data = error.response.data;
            oAlerta.show({
                message: data.errorDetails.message,
                type: "warning",
                container: "#modalConsultarCompra .modal-dialog"
            });
        }).finally(() => {
            oHelper.hideLoading();
            oCompra.initTblConsultarCompra();
        });
    },
    inicializarRangoFechas: function () {
        let fechaActual = dayjs();
        let fechaInicial = fechaActual.subtract(24, 'month').format("DD/MM/YYYY");
        let fechaFinal = fechaActual.format("DD/MM/YYYY");
        $('#txtRanFecIni').datepicker('update', fechaInicial);
        $('#txtRanFecFin').datepicker('update', fechaFinal);
    },
    bindingProveedor: function (modelo) {
        let cboTipDoc = document.getElementById('cboTipDoc');
        let txtNumDoc = document.getElementById('txtNumDoc');

        //bindig con los datos traidos del dialogo de buscar proveedor.
        document.getElementById('hddIdPro').value = modelo.idProveedor;
        document.getElementById('txtRazSoc').value = modelo.nomProveedor;
        cboTipDoc.value = modelo.idTipoDocumento;
        txtNumDoc.value = modelo.numDocumento;

        //habilitamos el boton buscar por numero doc. altermos el maxlenght del numero doc.
        document.getElementById('btnBusPorNum').disabled = false;
        txtNumDoc.disabled = false;
        txtNumDoc.maxLength = cboTipDoc.options[cboTipDoc.selectedIndex].getAttribute("data-maxDigitos");

        //Si el el tipo doc. del proveedor(consulta, registro) seleccionado esta desabilitado en el combo tipo doc.
        //de compras, habilitamos todos los documento y limpiamos el comprobante.
        let options = Array.from(cboTipDoc.querySelectorAll('option'));

        let disabled = options.find(x => x.value == response.idTipoDocumento).disabled;
        if (disabled) {
            options.forEach(y => y.disabled = false);
            document.getElementById('cboTipCom').value = "";
        }
    },
    bindingProveedorConsulta: function (modelo) {
        let cboTipDoc = document.getElementById('cboTipDocConsulta');
        let txtNumDoc = document.getElementById('txtNumDocConsulta');

        //bindig con los datos traidos del dialogo de buscar proveedor.
        document.getElementById('hddIdProConsulta').value = modelo.idProveedor;
        document.getElementById('txtRazSocConsulta').value = modelo.nomProveedor;
        cboTipDoc.value = modelo.idTipoDocumento;
        txtNumDoc.value = modelo.numDocumento;

        //habilitamos el boton buscar por numero doc. altermos el maxlenght del numero doc.
        document.getElementById('btnBusPorNumConsulta').disabled = false;
        txtNumDoc.disabled = false;
        txtNumDoc.maxLength = cboTipDoc.options[cboTipDoc.selectedIndex].getAttribute("data-maxDigitos");
    },
    limpiarTotales: function () {
        document.getElementById('lblSubTot').textContent = "0.00";
        document.getElementById('txtTasDes').textContent = "";
        document.getElementById('lblTotDes').textContent = "0.00";
        document.getElementById('lblTotIgv').textContent = "0.00";
        document.getElementById('lblTotal').textContent = "0.00";
        document.getElementById('lblTotRed').textContent = "0.00";
        document.getElementById('lblTotPag').textContent = `${oCompra.getSgnMoneda()} 0.00`;
    },
    getSgnMoneda: function () {
        let cboMoneda = document.getElementById('cboMoneda');
        return cboMoneda.options[cboMoneda.selectedIndex].getAttribute("data-sgnMoneda");
    },
    getIgv: function () {
        return (parseFloat(document.getElementById('txtIgv').value) / 100);
    },
    esAcredito: function () {
        let cbo = document.getElementById('cboForPag');
        return cbo.options[cbo.selectedIndex].getAttribute("data-flgEvaluaCredito") == "True" ? true : false;
    },
    calcularTotales: function () {
        let table = document.getElementById('tblDetalle');
        let tbody = table.getElementsByTagName('tbody')[0];
        let rows = tbody.rows;
        let count = rows.length;

        let sumTotal = 0, subTotal = 0, tasDes = 0, monDes = 0, monIgv = 0, total = 0, totalPagar = 0, decimalRestara = 0, bruto = 0;
        let igv = oCompra.getIgv();

        //Obtenemos el total del detalle
        for (var i = 0; i < count; i++) {
            let importe = rows[i].cells[7].children[0].value == "" ? 0 : parseFloat(rows[i].cells[7].children[0].value);
            sumTotal += importe;
        }

        tasDes = document.getElementById('txtTasDes').value == '' ? 0 : parseFloat(document.getElementById('txtTasDes').value);

        //Hallamos los demas totales
        if (sumTotal > 0) {
            //Para un cálculo mas perfecto se redondeará el subtotal en 2 decimales
            subTotal = parseFloat((sumTotal / (1 + igv)).toFixed(2));

            if (tasDes > 0) {
                monDes = (subTotal * (tasDes / 100));
                bruto = (subTotal - monDes);
                monIgv = (bruto * igv);
                total = (bruto + monIgv);
            } else {
                monIgv = (subTotal * igv);
                total = sumTotal;
            }

            totalPagar = ((parseInt(total.toFixed(2) * 10)) / 10);
            decimalRestara = (parseFloat(total.toFixed(2)) - totalPagar);
        }

        document.getElementById('lblSubTot').textContent = oHelper.formatoMiles(subTotal, 2);
        document.getElementById('lblTotDes').textContent = oHelper.formatoMiles(monDes, 2);
        document.getElementById('lblTotIgv').textContent = oHelper.formatoMiles(monIgv, 2);
        document.getElementById('lblTotal').textContent = oHelper.formatoMiles(total, 2);
        document.getElementById('lblTotRed').textContent = decimalRestara.toFixed(2);
        document.getElementById('lblTotPag').textContent = oHelper.formatoMoneda(oCompra.getSgnMoneda(), totalPagar, 2);

        if (subTotal == 0)
            document.getElementById('txtTasDes').value = "";

        if (oCompra.esAcredito()) {
            oCompra.limpiarAbono();
            document.getElementById('cboForPag').value = "";
        }
    },
    obtenerProveedorPorDocumento: function () {
        let cboTipDoc = document.getElementById('cboTipDoc');
        let txtNumDoc = document.getElementById('txtNumDoc');

        if (cboTipDoc.value == '') {
            oAlerta.show({
                message: "Debe de seleccionar el tipo de documento",
                type: "warning"
            });
            return;
        }
        if (txtNumDoc.value == '') {
            oAlerta.show({
                message: "Debe de ingresar el N° de documento",
                type: "warning"
            });
            return;
        }

        oHelper.showLoading("#cardProveedor");

        const parameters = `${cboTipDoc.value}/${txtNumDoc.value}`;

        axios.get(`/Proveedor/GetByDocument/${parameters}`).then(response => {
            const result = response.data;
            const modelo = result.data;

            document.getElementById('hddIdPro').value = modelo.idProveedor;
            document.getElementById('cboTipDoc').value = modelo.idTipoDocumento;
            document.getElementById('txtNumDoc').value = modelo.nroDocumento;
            document.getElementById('txtRazSoc').value = modelo.nomProveedor;
        }).catch((error) => {
            const data = error.response.data;
            oAlerta.show({
                message: data.errorDetails.message,
                type: "warning"
            });
        }).finally(() => oHelper.hideLoading());

    },
    obtenerProveedorPorDocumentoConsulta: function () {
        let cboTipDoc = document.getElementById('cboTipDocConsulta');
        let txtNumDoc = document.getElementById('txtNumDocConsulta');

        if (cboTipDoc.value == '') {
            oAlerta.show({
                message: "Debe de seleccionar el tipo de documento",
                type: "warning"
            });
            return;
        }
        if (txtNumDoc.value == '') {
            oAlerta.show({
                message: "Debe de ingresar el N° de documento",
                type: "warning"
            });
            return;
        }

        oHelper.showLoading("#modalConsultarCompra");

        const parameters = `${cboTipDoc.value}/${txtNumDoc.value}`;

        axios.get(`/Proveedor/GetByDocument/${parameters}`).then(response => {
            const modelo = response.data.Data;

            document.getElementById('hddIdProConsulta').value = modelo.IdProveedor;
            document.getElementById('cboTipDocConsulta').value = modelo.IdTipoDocumento;
            document.getElementById('txtNumDocConsulta').value = modelo.NroDocumento;
            document.getElementById('txtRazSocConsulta').value = modelo.NomProveedor;
        }).catch((error) => {
            const data = error.response.data;
            oAlerta.show({
                message: data.errorDetails.message,
                type: "warning"
            });
        }).finally(() => oHelper.hideLoading());

    },
    obtenerArticuloPorCodigoBarra: function () {
        let txtCodBar = document.getElementById('txtCodBar');
        if (txtCodBar.value == "")
            oAlerta.show({
                message: "Debe de ingresar el código de barra",
                type: "warning"
            })

        oHelper.showLoading();
        axios.get(`/Articulo/GetByBarcode/${txtCodBar.value}/${true}`).then((response) => {
            let result = response.data;
            if (!result.resultado)
                return;

            let articulo = result.data;
            let modelo = {
                idArticulo: articulo.idArticulo,
                codigo: articulo.codigo,
                descripcion: articulo.nomArticulo,
                jsonListaUm: articulo.listaUm
            };

            //Agregamos el artículo encontrado al detalle.
            oCompra.agregarArticulo(modelo).then(() => {
                document.getElementById('btnLimCodBar').click();
            }).catch(error => {
                oAlerta.show({
                    message: error,
                    type: "warning"
                });
                document.getElementById('btnLimCodBar').click();
            });
        }).catch((error) => {
            const data = error.response.data;
            oAlerta.show({
                message: data.errorDetails.message,
                type: "warning"
            });
        }).finally(() => oHelper.hideLoading());
    },
    agregarArticulo: function (modelo) {
        let table = document.getElementById('tblDetalle');
        let tbody = table.getElementsByTagName('tbody')[0];
        let tr = document.createElement('tr');

        return new Promise((resolve, reject) => {
            //Validamos que aún no se haya ingresado.
            let error = '';
            let arrId = tbody.querySelectorAll('tr td:nth-child(10)');
            let count = arrId.length;
            if (count > 0) {
                for (var i = 0; i < count; i++) {
                    if (arrId[i].textContent == modelo.idArticulo) {
                        error = 'Artículo ya ingresado.';
                        break;
                    }
                }
            }
            if (error != '')
                return reject(error);

            //Construímos las UM del articulo.
            let selected = '', nroFactor = '';
            if (modelo.jsonListaUm.length == 1) {
                selected = 'selected';
                nroFactor = modelo.jsonListaUm[0].nroFactor;
            }

            let option = '<option value>---Seleccione---</option>';
            modelo.jsonListaUm.forEach(x => {
                option += `<option value="${x.idUm}" ${selected} data-nroFactor="${x.nroFactor}">${x.nomUm}</option>`
            });

            let cboUm = `<select class="form-select form-select-sm">${option}</select>`;
            let txtPrecio = '<input class="form-control form-control-sm text-end" type="text" style="width:80px"/>';
            let txtCantidad = '<input class="form-control form-control-sm text-end" type="text" value=1 style="width:80px"/>';
            let txtDescuento = '<input class="form-control form-control-sm text-end" type="number" min="0" max="100" step="5" style="width:80px"/>';
            let txtImporte = '<input class="form-control form-control-sm text-end" type="text" style="width:100px"/>';

            let td = `<td>${modelo.codigo}</td>
                    <td>${modelo.descripcion}</td>
                    <td>${cboUm}</td>
                    <td class='text-end'>${nroFactor}</td>
                    <td class='text-end'>${txtPrecio}</td>
                    <td>${txtCantidad}</td>
                    <td>${txtDescuento}</td>
                    <td>${txtImporte}</td>
                    <td><button type="button" class="btn btn-danger btn-sm" ><i class="bi bi-trash-fill"></i></button></td>
                    <td class='d-none'>${modelo.idArticulo}</td>`;

            tr.innerHTML = td;
            tbody.appendChild(tr);

            //Todo OK
            resolve();
        });

    },
    inicializarDatosProveedor: function (cbo) {
        oCompra.limpiarProveedor(false);

        let txtNumDoc = document.getElementById('txtNumDoc');
        if (cbo.value == "") {
            document.getElementById('btnBusPorNum').disabled = true;
            txtNumDoc.disabled = true;
        } else {
            document.getElementById('btnBusPorNum').disabled = false;
            txtNumDoc.disabled = false;
            txtNumDoc.maxLength = cbo.options[cbo.selectedIndex].getAttribute("data-maxDigitos");
            txtNumDoc.focus();
        }
    },
    limpiarProveedor: function (bLimpiarTipDoc) {
        if (!!bLimpiarTipDoc)
            document.getElementById('cboTipDoc').value = "";

        document.getElementById('hddIdPro').value = "";
        document.getElementById('txtNumDoc').value = "";
        document.getElementById('txtRazSoc').value = "";
    },
    limpiarProveedorConsulta: function (bLimpiarTipDoc) {
        if (!!bLimpiarTipDoc)
            document.getElementById('cboTipDocConsulta').value = "";

        document.getElementById('hddIdProConsulta').value = "";
        document.getElementById('txtNumDocConsulta').value = "";
        document.getElementById('txtRazSocConsulta').value = "";
    },
    inicializarDatosProveedorConsulta: function (bInicializarTodo) {
        oCompra.limpiarProveedorConsulta(bInicializarTodo);

        document.getElementById('txtNumDocConsulta').disabled = bInicializarTodo
        document.getElementById('btnBusPorNumConsulta').disabled = bInicializarTodo;
    },
    limpiarComprobanteConsulta: function (bLimpiarTipCom) {
        if (!!bLimpiarTipCom)
            document.getElementById('cboTipComConsulta').value = "";

        document.getElementById('txtSerieConsulta').value = "";
        document.getElementById('txtNumeroConsulta').value = "";
    },
    inicializarDatosComprobanteConsulta: function (bInicializarTodo) {
        //Limpiamos los elementos relacionados al comprobante en las pestaña de consulta.
        oCompra.limpiarComprobanteConsulta(bInicializarTodo);

        document.getElementById('txtSerieConsulta').disabled = bInicializarTodo;
        document.getElementById('txtNumeroConsulta').disabled = bInicializarTodo;
    },
    seleccionarFormaPago: function (e) {
        let cbo = e.target;
        let flgEvaluaCredito = cbo.options[cbo.selectedIndex].getAttribute("data-flgEvaluaCredito") == "True" ? true : false;
        //Evaluamos si es a crédito
        if (flgEvaluaCredito) {
            if (document.getElementById('lblTotal').textContent == 0) {
                oAlerta.show({
                    message: "Debe de existir un monto total de la compra para realizar el abono",
                    type: "warning"
                });
                document.getElementById('cboForPag').value = "";
                return;
            };

            let txtFecVen = document.getElementById('txtFecVen');
            if (txtFecVen.value == "") {
                oAlerta.show({
                    message: "Debe de seleccionar la fecha de vencimiento si la forma de pago es a crédito",
                    type: "warning"
                });
                document.getElementById('cboForPag').value = "";
                return;
            } else {
                let fechaActual = dayjs().format("YYYY/MM/DD");
                fechaActual = dayjs(fechaActual);

                let fechaVencimiento = dayjs(txtFecVen.value, "DD/MM/YYYY").format("YYYY/MM/DD");
                fechaVencimiento = dayjs(fechaVencimiento);

                //Si la fecha es menor a la fecha actual retorna false
                if (fechaVencimiento.isBefore(fechaActual)) {
                    oAlerta.show({
                        message: "La fecha de vencimiento no puede ser menor a la fecha actual.",
                        type: "warning"
                    });
                    document.getElementById('cboForPag').value = "";
                    return;
                }
            };

            //Enviamos un modelo al modal como inicialización.
            //Inicialiamos la fecha de cancelacion con la fecha de vencimiento pero podría ser cambiado.
            let modelo = {
                total: document.getElementById('lblTotPag').textContent,
                abono: 0,
                saldo: 0,
                fechaEmision: document.getElementById('txtFecEmi').value,
                fechaCancelacion: txtFecVen.value
            }
            //Indicamos si el abrir del modal será en modo edición.
            let flgEditar = false;

            //Abrimos el modal de abono de crédito
            oModalAbono.show(modelo, flgEditar).then(response => {
                //Los datos ingresados en el modal se motrarán en el panel de abono de la vista.
                oCompra.bindingAbono(response);
            }).catch((sw) => {
                oCompra.limpiarAbono();
                document.getElementById('cboForPag').value = "";
            });
        } else {
            oCompra.limpiarAbono();
        }
    },
    bindingAbono: function (modelo) {
        let sgnMoneda = oCompra.getSgnMoneda();

        oCompra.modeloAbono = {
            total: document.getElementById('lblTotPag').textContent,
            abono: modelo.abono,
            saldo: modelo.saldo,
            fechaCancelacion: modelo.fechaCancelacion
        };

        document.getElementById('txtAbono').value = oHelper.formatoMoneda(sgnMoneda, modelo.abono, 2);
        document.getElementById('txtSaldo').value = oHelper.formatoMoneda(sgnMoneda, modelo.saldo, 2);
        document.getElementById('panelAbono').style.display = "block";
    },
    limpiarAbono: function () {
        document.getElementById('panelAbono').style.display = "none";
        document.getElementById('txtAbono').value = "";
        document.getElementById('txtSaldo').value = "";
        oCompra.modeloAbono = null;
    },
    nuevo: function () {
        document.getElementById('cboTipCom').value = "";
        document.getElementById('txtSerie').value = "";
        document.getElementById('txtNumero').value = "";
        $("#txtFecEmi").datepicker('clearDates');
        $("#txtFecVen").datepicker('clearDates');
        document.getElementById('cboTipDoc').value = "";
        document.getElementById('hddIdPro').value = "";
        let txtNumDoc = document.getElementById('txtNumDoc');
        txtNumDoc.disabled = true;
        txtNumDoc.value = "";
        document.getElementById('txtRazSoc').value = "";
        document.getElementById('txtCodBar').value = "";
        document.getElementById('txtIgv').value = document.getElementById('hddIgv').value;

        oHelper.limpiarTabla(document.getElementById('tblDetalle'));

        document.getElementById('cboTipPag').value = "";
        document.getElementById('cboForPag').value = "";
        document.getElementById('txtObservacion').value = "";

        oCompra.limpiarAbono();

        let iniTot = (0).toFixed(2);
        document.getElementById('lblSubTot').textContent = iniTot;
        document.getElementById('lblTotDes').textContent = iniTot;
        document.getElementById('lblTotIgv').textContent = iniTot;
        document.getElementById('lblTotal').textContent = iniTot;
        document.getElementById('lblTotRed').textContent = iniTot;
        document.getElementById('lblTotPag').textContent = oHelper.formatoMoneda(oCompra.getSgnMoneda(), 0, 2);
        document.getElementById('txtTasDes').value = "";
        document.getElementById('spnEstado').value = "";

        let spnEstado = document.getElementById('spnEstado');
        spnEstado.classList.remove("bg-danger", "bg-success");
        spnEstado.textContent = "";

        oCompra.desabilitar(false);

        oCompra.botonera(true);

    },
    desabilitar: function (sw) {
        document.getElementById('cboTipCom').disabled = sw;
        document.getElementById('txtSerie').disabled = sw;
        document.getElementById('txtNumero').disabled = sw;
        document.getElementById('txtFecEmi').disabled = sw;
        document.getElementById('txtFecVen').disabled = sw;
        document.getElementById('cboTipDoc').disabled = sw;
        document.getElementById('btnNuePro').disabled = sw;
        document.getElementById('btnConPro').disabled = sw;

        if (!sw) {
            //Utilizado para el boton nuevo
            if (document.getElementById('cboTipDoc').value == "") {
                document.getElementById('txtNumDoc').disabled = true;
                document.getElementById('btnBusPorNum').disabled = true;
            } else {
                //Habilitado desde la opcion crear copia al anular.
                document.getElementById('txtNumDoc').disabled = sw;
                document.getElementById('btnBusPorNum').disabled = sw;
            }
        } else {
            document.getElementById('txtNumDoc').disabled = sw;
            document.getElementById('btnBusPorNum').disabled = sw;
        }

        document.getElementById('txtCodBar').disabled = sw;
        document.getElementById('btnLimCodBar').disabled = sw;
        document.getElementById('btnBusPorCodBar').disabled = sw;
        document.getElementById('btnAgrArt').disabled = sw;
        document.getElementById('txtIgv').disabled = sw;

        let table = document.getElementById('tblDetalle');
        let tbody = table.getElementsByTagName('tbody')[0];

        if (tbody.rows.length > 0) {
            Array.from(tbody.rows).forEach(x => {
                let cells = x.cells;
                cells[2].children[0].disabled = sw;
                cells[4].children[0].disabled = sw;
                cells[5].children[0].disabled = sw;
                cells[6].children[0].disabled = sw;
                cells[7].children[0].disabled = sw;
                cells[8].children[0].disabled = sw;
            });
        }

        document.getElementById('cboTipPag').disabled = sw;
        document.getElementById('cboForPag').disabled = sw;
        document.getElementById('txtObservacion').disabled = sw;

        document.getElementById('txtTasDes').disabled = sw;
    },
    botonera: function (bNuevo) {
        if (bNuevo) {
            document.getElementById('btnNuevo').disabled = !bNuevo;
            document.getElementById('btnGrabar').disabled = !bNuevo;
            document.getElementById('btnAnular').disabled = bNuevo;
            document.getElementById('btnBuscar').disabled = !bNuevo;
            document.getElementById('btnImprimir').disabled = bNuevo;
        } else {
            document.getElementById('btnNuevo').disabled = bNuevo;
            document.getElementById('btnGrabar').disabled = !bNuevo;
            document.getElementById('btnBuscar').disabled = bNuevo;
            document.getElementById('btnImprimir').disabled = bNuevo;

            if (document.getElementById('spnEstado').getAttribute('data-idEstado') == "3")
                document.getElementById('btnAnular').disabled = true;
            else
                document.getElementById('btnAnular').disabled = bNuevo;
        }
    },
    validarForm: function () {
        return new Promise((resolve, reject) => {
            if (document.getElementById('cboTipCom').value == "")
                return reject("Seleccione el tipo de comprobante.");

            let txtSerie = document.getElementById('txtSerie');
            if (txtSerie.value == 0) {
                return reject("Ingrese la serie del comprobante.");
            } else {
                let lengthMax = 4;
                if (isNaN(txtSerie.value)) {
                    if (txtSerie.value.length < lengthMax) {
                        return reject(`Debe de tener al menos ${lengthMax} caracteres la serie.`);
                    }
                    //No debe de haber mas de una letra
                    let arr = txtSerie.value.split('');
                    if (arr.filter(x => isNaN(x)).length > 1) {
                        return reject("Formato no válido en la serie");
                    }

                    let cboTipCom = document.getElementById('cboTipCom');
                    let nomTipCom = cboTipCom.options[cboTipCom.selectedIndex].text;
                    if (nomTipCom.toUpperCase().substring(0, 1) != txtSerie.value.toUpperCase().substring(0, 1))
                        return reject("La letra inicial de la serie no coincide con el tipo de comprobante.");
                } else {
                    let serie = `${("0").repeat(lengthMax)}${txtSerie.value}`;
                    serie = serie.revertir().substring(0, lengthMax).revertir();
                    txtSerie.value = serie;
                }
            }

            if (document.getElementById('txtSerie').value.length > 4)
                return reject("La serie del comprobante debe ser máximo 4 caracteres.");

            if (document.getElementById('txtNumero').value == "")
                return reject("Ingrese el n° de documento del comprobante.");

            if (document.getElementById('txtNumero').value.length > 6)
                return reject("El número del comprobante debe ser máximo 6 caracteres.");

            if (document.getElementById('txtFecEmi').value == "")
                return reject("Seleccione la fecha de emision del comprobante");

            if (document.getElementById('txtFecVen').value == "")
                return reject("Seleccione la fecha de vencimiento del comprobante.");

            let fechaEmision = document.getElementById('txtFecEmi').value;
            let fechaVencimiento = document.getElementById('txtFecVen').value;
            let fechaActual = dayjs().format("YYYY/MM/DD");

            if (dayjs(fechaEmision, 'DD/MM/YYYY').isAfter(dayjs(fechaActual))) {
                return reject("La fecha de emisión no puede ser mayor a la fecha actual.");
            }

            if (dayjs(fechaVencimiento, 'DD/MM/YYYY').isBefore(dayjs(fechaEmision, 'DD/MM/YYYY'))) {
                return reject("La fecha de vencimiento no puede ser menor a la fecha de emisión.");
            }

            if (document.getElementById('hddIdPro').value == "")
                return reject("Ingrese el proveedor.");

            if (document.getElementById('cboTipDoc').value == "")
                return reject("Seleccione el tipo de documento del proveedor.");

            if (document.getElementById('txtNumDoc').value == "")
                return reject("Ingrese el R.U.C del proveedor.");

            if (document.getElementById('cboTipPag').value == "")
                return reject("Seleccione el tipo de pago.");

            if (document.getElementById('cboForPag').value == "")
                return reject("Seleccione la forma de pago.");

            let table = document.getElementById('tblDetalle');
            let tbody = table.getElementsByTagName('tbody')[0];
            let rows = tbody.rows;
            let count = rows.length;

            if (count == 0)
                return reject("No existe detalle en la compra.");

            let messageError = "";
            let detalle = [];
            for (let i = 0; i < count; i++) {
                if (rows[i].cells[2].children[0].value == "") {
                    messageError = `seleccione la unidad de medida del artículo ${rows[i].cells[1].textContent}.`;
                    break;
                }

                if (rows[i].cells[4].children[0].value == 0) {
                    messageError = `Ingrese el precio en el artículo ${rows[i].cells[1].textContent}.`;
                    break;
                }

                if (rows[i].cells[5].children[0].value == 0) {
                    messageError = `Ingrese la cantidad en el artículo ${rows[i].cells[1].textContent}.`;
                    break;
                }
                let tasDescuento = rows[i].cells[6].children[0].value;
                detalle.push({
                    IdArticulo: rows[i].cells[9].textContent,
                    IdUm: rows[i].cells[2].children[0].value,
                    NroFactor: rows[i].cells[3].textContent,
                    PrecioArticulo: rows[i].cells[4].children[0].value,
                    Cantidad: rows[i].cells[5].children[0].value,
                    TasDescuento: tasDescuento == "" ? 0 : tasDescuento,
                    Importe: rows[i].cells[7].children[0].value
                })
            }
            if (messageError != "")
                return reject(messageError);

            return resolve({ jsonArticulo: JSON.stringify(detalle) });
        })
    },
    grabar: function (params) {
        oAlertaModal.showConfirmation({
            title: oCompra.titulo,
            message: "¿Desea guardar los datos ingresados?"
        }).then((ok) => {
            let jsonArticulo = params.jsonArticulo
            let flgRetirarCaja = params.flgRetirarCaja == undefined ? false : params.flgRetirarCaja;

            let parameters = {
                IdTipoComprobante: document.getElementById('cboTipCom').value,
                NroSerie: document.getElementById('txtSerie').value,
                NroDocumento: document.getElementById('txtNumero').value,
                IdProveedor: document.getElementById('hddIdPro').value,
                IdMoneda: document.getElementById('cboMoneda').value,
                FecCompra: document.getElementById('txtFecEmi').value,
                FecVencimiento: document.getElementById('txtFecVen').value,
                IdTipoPago: document.getElementById('cboTipPag').value,
                IdTipoCondicionPago: document.getElementById('cboForPag').value,
                TotBruto: oHelper.numeroSinMiles(document.getElementById('lblSubTot').textContent),
                TotDescuento: oHelper.numeroSinMiles(document.getElementById('lblTotDes').textContent),
                TasDescuento: document.getElementById('txtTasDes').value == "" ? 0 : document.getElementById('txtTasDes').value,
                TasIgv: document.getElementById('txtIgv').value,
                TotImpuesto: oHelper.numeroSinMiles(document.getElementById('lblTotIgv').textContent),
                TotCompra: oHelper.numeroSinMiles(document.getElementById('lblTotal').textContent),
                JsonArticulos: jsonArticulo,
                Abono: oCompra.modeloAbono != null ? oCompra.modeloAbono.abono : 0,
                Saldo: oCompra.modeloAbono != null ? oCompra.modeloAbono.saldo : 0,
                FechaCancelacion: oCompra.modeloAbono != null ? oCompra.modeloAbono.fechaCancelacion : '',
                Observacion: document.getElementById('txtObservacion').value,
                FlgRetirarCaja: params.flgRetirarCaja,
                MontoRetiraCaja: flgRetirarCaja ? params.montoRetiraCaja : 0,
                IdCaja: params.flgRetirarCaja ? params.idCaja : '',
                CorrelativoCa: params.flgRetirarCaja ? params.correlativoCa : 0
            };

            oHelper.showLoading();

            axios.post("/Compra/Register", parameters).then((response) => {
                const result = response.data;

                if (result.success) {
                    oAlerta.show({
                        message: result.message,
                        type: "success"
                    });

                    oCompra.nuevo();
                    oCompra.inicializarPestaniaConsulta();
                }

            }).catch((error) => {
                const data = error.response.data;
                oAlerta.show({
                    message: data.errorDetails.message,
                    type: "warning"
                });
            }).finally(() => oHelper.hideLoading());
        })

    },
    initTblConsultarCompra: function () {
        let aoColumns = [
            { "bSortable": false },
            { "bSortable": true },
            { "bSortable": true },
            { "bSortable": true },
            { "bSortable": true },
            { "bSortable": true },
            { "bSortable": true },
            { "bSortable": true },
            { "bSortable": false },
            { "bSortable": false },
            { "bSortable": false },
            { "bSortable": false }];

        oConfigControls.inicializarDataTable({
            selector: "#tblConsultarCompra",
            arrColumns: aoColumns,
            bPaginate: true,
            bInfo: true,
        });
    },
}

document.addEventListener('DOMContentLoaded', oCompra.init);