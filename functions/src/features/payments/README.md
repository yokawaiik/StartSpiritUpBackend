# Модуль платежей, возврата и оплаты


## Процесс оплаты

[Процесс оплаты](https://drive.google.com/file/d/12a8Mt8ZIfCsqR3OEdjCwoS_dH3CWKeKD/view?usp=sharing)

### Последовательность вызовов

#### Оплата, если карта уже есть (оплату уже совершал ранее)
1. payWithPaymentMethod - создание на стороне Ukassa платежа (чека)
2. ukassaWebhook - обрабатывает платеж и меняет статус документа

#### Оплата первый раз
1. initialPayment - создание на стороне Ukassa платежа (чека)
2. ukassaWebhook - обрабатывает платеж и меняет статус документа

#### Возврат 
1. refundPayment - 
2. ukassaWebhook - обрабатывает возврат и меняет статус документа

## Функции 

[Вызываются в коде Dart](https://firebase.flutter.dev/docs/functions/usage/#calling-endpoints-with-parameters)

<!-- Функции требуют заголовок 
    Authorization: ${user_id_token} -->

STATUS:
    200 - OK
    400 - Требуемые параметры не найдены
    401 - Не авторизован
    403 - Запрещено действие
    404 - Документ не найден
    500 - Ошибка сервера

### Function URL (base_features:initialPayment(us-central1))

Параметры:
    orderRefPath: string,

Объект ответа с полями:
```
    {
        status: int // [STATUS],
        message: String // не обязательныое поле
        order: Map<String, dynamic> // дубликат объекта orders
        orderPath: String, // ref path на документ в orders
        url: String, // ссылка на оплату в Ukassa 
        error: String // не обязательныое поле, если есть
    }
```

### Function URL (base_features:payWithPaymentMethod(us-central1))

Параметры:
    orderRefPath: string
    paymentMethodRefPath: string

Ответы:
```
    {
        status: int // [STATUS],
        message: String // не обязательныое поле
        error: String // не обязательныое поле, если есть
    }
```

### Function URL (base_features:refundPayment(us-central1))

Параметры:
    orderRefPath: string

Ответы:
```
    {
        status: int // [STATUS],
        message: String // не обязательныое поле
        error: String // не обязательныое поле, если есть
    }
```

### Function URL (base_features:ukassaWebhook(us-central1))


## Триггер updatePayoutsRequestsTrigger для коллекции payout_requests
Работает для коллекции payout_requests/{doc} и реагирует при изменении в документе поля:
    status = pending --> status = accepted

## Триггер updateEventsTrigger для коллекции events 
Работает для коллекции events/{doc} и реагирует при изменении в документе поля: status.

При изменении 

```
    status = [ANY] --> status = completed 
``` 

происходит:
- увеличение **user.balance** на величину **order.amount** по **seller_ref** 
- изменение **order.status** на **completed**

<!-- Возможно, следует добавить в структуру коллекции поле message_ref - для того, чтобы изменять сообщение о выводе -->





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



## Ссылки 

1. [Тестовые карты для Ukassa](https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing#test-bank-card)