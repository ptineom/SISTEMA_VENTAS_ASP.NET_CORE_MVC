﻿using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AplicacionWeb.SistemaVentas.Controllers
{
    public class VentaController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult ConsultaVentasIndex()
        {
            return View();
        }
    }
}
