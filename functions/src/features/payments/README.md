1. initialPayment - инициализация платежа
2. payWithPaymentMethod - оплата если у пользователя есть сохраненная карта
3. ukassaWebhook - обрабатывает платеж





## Если карта уже есть
1. payWithPaymentMethod
2. ukassaWebhook

## Первый раз
1. initialPayment
2. ukassaWebhook



# добавить триггер для коллекции payout_requests




## Возврат

withdrawMoney



users {
    double balance,
    String payment_card,
}


payments {
    DocumentReference guide,
    DocumentReference user,
    DocumentReference? event,
    DateTime date,
    double amount,
    String type,
}


type { payment, withdraw, refund}




## Вызовы в dart

paymentEvent(
    DocumentReference guide,
    DocumentReference user,
    DocumentReference event, 
    double balance,
    ) {
    // прибавляем к балансу гида
    // создаем документ в коллекции payments
}


refundEvent(DocumentReference event) {
    // отбираем у гида и делаем как-то возврат юзеру
    // создаем документ в коллекции payments
}

