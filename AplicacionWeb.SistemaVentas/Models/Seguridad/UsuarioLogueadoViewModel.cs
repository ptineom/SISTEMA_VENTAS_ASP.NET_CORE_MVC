﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AplicacionWeb.SistemaVentas.Models.Seguridad
{
    public class UsuarioLogueadoViewModel
    {
        public string idUsuario { get; set; }
        public string nomUsuario { get; set; }
        public string nomRol { get; set; }
        public string idSucursal { get; set; }
        public bool flgCtrlTotal { get; set; }
    }
}
