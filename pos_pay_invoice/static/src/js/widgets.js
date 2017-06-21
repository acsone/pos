/*
    © 2017 Acsone SA/NV (https://www.acsone.eu)
    License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
*/

odoo.define('pos_pay_invoice.widgets', function (require) {
    "use strict";

    var core = require('web.core');
    var Widget = require('web.Widget');

    var _t = core._t;

    var PosBaseWidget = require('point_of_sale.BaseWidget');

    var PayInvoiceWidget = PosBaseWidget.extend({
        template: 'PayInvoiceWidget',
        events: {
            'click .pay-invoice-button': 'open_pay_invoice_screen',
        },

        open_pay_invoice_screen: function() {
            var self = this;
            self.gui.show_screen('invoicelist');
        },

    });

    return {
        PayInvoiceWidget: PayInvoiceWidget,
    };
});

