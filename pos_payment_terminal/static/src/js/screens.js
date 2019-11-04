/*
    POS Payment Terminal module for Odoo
    Copyright (C) 2014-2016 Aurélien DUMAINE
    Copyright (C) 2014-2016 Akretion (www.akretion.com)
    @author: Aurélien DUMAINE
    @author: Alexis de Lattre <alexis.delattre@akretion.com>
    License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
*/

odoo.define('pos_payment_terminal.screens', function (require) {
    "use strict";

    var screens = require('point_of_sale.screens');

    screens.PaymentScreenWidget.include({
        transaction_changed: function(line){
            // Allows to change interface
            var self = this;
            var order = self.pos.get_order();
            self.render_paymentlines();
            order.save_to_db();
            if (line.terminal_transaction_success === false){
                self.$('.delete-button[data-cid='+ line.cid + ']').toggle(true);
            }
        },
        render_paymentlines : function(){
            this._super.apply(this, arguments);
            var self = this;
            this.$('.paymentlines-container').unbind('click').on('click', '.payment-terminal-transaction-start', self.on_click_transaction_start);
            var payment_lines = self.pos.get_order().get_paymentlines()
            for (var line_id in payment_lines){
                var payment_line = payment_lines[line_id]
                if (payment_line.terminal_transaction_id && !payment_line.terminal_transaction_success || payment_line.terminal_transaction_success === true){
                    self.$('.delete-button[data-cid='+ payment_line.cid + ']').toggle(false);
                }
            }
        },
        hide_transaction_started: function(line_cid){
            var self = this;
            self.$('.payment-terminal-transaction-start[data-cid='+ line_cid + ']').toggle(false);
            self.$('.delete-button[data-cid='+ line_cid + ']').toggle(false);
        },
        on_click_transaction_start: function(event){
            var line_cid = $(event.currentTarget).data('cid');
            var self = this;
            self.hide_transaction_started(line_cid);
            self.order_changes();
            self.pos.proxy.payment_terminal_transaction_start(line_cid, self.pos.currency.name, self.pos.currency.decimals);
        },
    });
});