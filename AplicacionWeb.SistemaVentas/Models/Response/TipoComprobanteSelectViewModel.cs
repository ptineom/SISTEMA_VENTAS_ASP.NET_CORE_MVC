﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AplicacionWeb.SistemaVentas.Models.Response
{
    public class TipoComprobanteSelectViewModel
    {
        public string IdTipoComprobante { get; set; }
        public string NomTipoComprobante { get; set; }
        public bool FlgRendirSunat { get; set; }
    }
}
