/*
    POS Payment Terminal module for Odoo
    Copyright (C) 2014-2016 Aurélien DUMAINE
    Copyright (C) 2014-2016 Akretion (www.akretion.com)
    Copyright (C) 2019 ACSONE SA/NV
    @author: Aurélien DUMAINE
    @author: Alexis de Lattre <alexis.delattre@akretion.com>
    License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
*/

odoo.define('pos_payment_terminal.screens', function (require) {
    "use strict";

    var screens = require('point_of_sale.screens');

    screens.PaymentScreenWidget.include({
        deactivate_validate_button: function(){
            this.$('.next').toggle(false);
        },
        activate_validate_button: function(){
            this.$('.next').toggle(true);
        },
        transaction_changed: function(line){
            // Allows to change variable for interface
            var self = this;
            var order = self.pos.get_order();
            order.save_to_db();
            self.render_paymentlines();
        },
        render_paymentlines : function(){
            // Manages the interface part
            this._super.apply(this, arguments);
            var self = this;
            this.$('.paymentlines-container').unbind('click').on('click', '.payment-terminal-transaction-start', self.on_click_transaction_start);
            var order = self.pos.get_order();
            var payment_lines = order.get_paymentlines()
            for (var line_id in payment_lines){
                var payment_line = payment_lines[line_id]
                if (!payment_line.show_delete_button()){
                    self.$('.delete-button[data-cid='+ payment_line.cid + ']').toggle(false);
                }
                else{
                    self.$('.delete-button[data-cid='+ payment_line.cid + ']').toggle(true);
                }
            }
            if (!order.show_validate_button()){
                self.deactivate_validate_button();
            }
            else{
                self.activate_validate_button();
            }
        },
        on_click_transaction_start: function(event){
            // Event triggered by click on 'Start transaction' button
            //
            var self = this;
            var line_cid = $(event.currentTarget).data('cid');
            //self.set_transaction_started(line_cid);
            self.order_changes();
            self.start_transaction(line_cid);
            self.render_paymentlines();
        },
        start_transaction: function(line_cid){
            var self = this;
            self.pos.proxy.payment_terminal_transaction_start(line_cid);
        }
    });
});