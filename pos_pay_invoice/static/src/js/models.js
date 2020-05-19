/*
    © 2017 Acsone SA/NV (http://www.acsone.eu)
    License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
*/

odoo.define('pos_pay_invoice.models', function (require) {
"use strict";

    var core = require('web.core');
    var Model = require('web.Model');

    var PosModels = require('point_of_sale.models');

    var OrderLine = PosModels.Orderline;
    var OrderLineSuper = OrderLine.prototype;

    PosModels.Orderline = OrderLine.extend({
        initialize: function (session, attributes) {
            var self = this;
            self.invoice_id = false;
            self.invoice_partner_id = false;
            return OrderLineSuper.initialize.call(self, session, attributes);
        },

        init_from_JSON: function(json) {
            var self = this;
            OrderLineSuper.init_from_JSON.call(self, json);
            self.invoice_id = json.invoice_id;
            self.invoice_partner_id = json.invoice_partner_id;
        },

        export_as_JSON: function() {
            var self = this;
            var json_repr = OrderLineSuper.export_as_JSON.call(self, arguments);
            json_repr.invoice_id = self.invoice_id;
            json_repr.invoice_partner_id = self.invoice_partner_id;
            return json_repr;
        },

        export_for_printing: function() {
            var self = this;
            var json_repr = OrderLineSuper.export_for_printing.call(self, arguments);
            json_repr.invoice_id = self.invoice_id;
            json_repr.invoice_partner_id = self.invoice_partner_id;
            return json_repr;
        }
    });


});
