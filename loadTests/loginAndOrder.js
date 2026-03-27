import { sleep, group } from 'k6'
import http from 'k6/http'
import jsonpath from 'https://jslib.k6.io/jsonpath/1.0.2/index.js'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Login_and_Purchase: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 20, duration: '1m' },
        { target: 20, duration: '3m30s' },
        { target: 0, duration: '1m' },
      ],
      gracefulRampDown: '30s',
      exec: 'login_and_Purchase',
    },
  },
}

export function login_and_Purchase() {
  let response

  const vars = {}

  group('page_0 - https://pizza.pizzaboston.click/', function () {
    // Get User
    response = http.put(
      'https://pizza-service.pizzaboston.click/api/auth',
      '{"email":"test@test.com","password":"test"}',
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          'Sec-Fetch-Site': 'same-site',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Sec-Fetch-Mode': 'cors',
          Host: 'pizza-service.pizzaboston.click',
          Origin: 'https://pizza.pizzaboston.click',
          Connection: 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
        },
      }
    )

    vars['token'] = jsonpath.query(response.json(), '$.token')[0]

    sleep(1.7)

    // Get Menu
    response = http.get('https://pizza-service.pizzaboston.click/api/order/menu', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vars['token']}`,
        Origin: 'https://pizza.pizzaboston.click',
        Accept: '*/*',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
      },
    })

    // Get Franchise
    response = http.get(
      'https://pizza-service.pizzaboston.click/api/franchise?page=0&limit=20&name=*',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vars['token']}`,
          Origin: 'https://pizza.pizzaboston.click',
          Accept: '*/*',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
        },
      }
    )
    sleep(4.2)

    // Check user
    response = http.get('https://pizza-service.pizzaboston.click/api/user/me', {
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
        Authorization: `Bearer ${vars['token']}`,
        'Sec-Fetch-Site': 'same-site',
        'Accept-Language': 'en-US,en;q=0.9',
        'If-None-Match': 'W/"5a-6S8ch/kIiVgkoz2sRJjTr5qVuto"',
        'Sec-Fetch-Mode': 'cors',
        'Accept-Encoding': 'gzip, deflate, br',
        Origin: 'https://pizza.pizzaboston.click',
        Connection: 'keep-alive',
        Host: 'pizza-service.pizzaboston.click',
        'Sec-Fetch-Dest': 'empty',
      },
    })
    sleep(1.6)

    // Buy Pizza
    response = http.post(
      'https://pizza-service.pizzaboston.click/api/order',
      '{"items":[{"menuId":1,"description":"Veggie","price":0.0038}],"storeId":"1","franchiseId":1}',
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          Authorization: `Bearer ${vars['token']}`,
          'Sec-Fetch-Site': 'same-site',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Sec-Fetch-Mode': 'cors',
          Host: 'pizza-service.pizzaboston.click',
          Origin: 'https://pizza.pizzaboston.click',
          Connection: 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
        },
      }
    )
    sleep(1.2)

    // Verify pizza
    response = http.post(
      'https://pizza-factory.cs329.click/api/order/verify',
      '{"jwt":"eyJpYXQiOjE3NzQzOTAyNDcsImV4cCI6MTc3NDQ3NjY0NywiaXNzIjoiY3MzMjkuY2xpY2siLCJhbGciOiJSUzI1NiIsImtpZCI6Ik9TcF94VzhlM3kwNk1KS3ZIeW9sRFZMaXZXX2hnTWxhcFZSUVFQVndiY0UifQ.eyJ2ZW5kb3IiOnsiaWQiOiJic3BlYXJzNSIsIm5hbWUiOiJCb3N0b24gU3BlYXJzIn0sImRpbmVyIjp7ImlkIjo0LCJuYW1lIjoidGVzdCIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSJ9LCJvcmRlciI6eyJpdGVtcyI6W3sibWVudUlkIjoxLCJkZXNjcmlwdGlvbiI6IlZlZ2dpZSIsInByaWNlIjowLjAwMzh9XSwic3RvcmVJZCI6IjEiLCJmcmFuY2hpc2VJZCI6MSwiaWQiOjE5MH19.Nd166FImEzWcqb-_xa4gWrvZbNl72-HRYRIK4ocnClS4a1g59jJl-ejEEZMc28II3stwy110v5jAihjDDn4viTo5OVJPWxo72Y0SPytN72k3GTsGDYDQSTfaNpDCIxCOCht0bIag9kd2TnUlFBTfQ5yFKaUw1UGQSGBFeaACrPKC3g8yN4CEz-w7Mz4eVtIyLkyXGPbsv-tjNdUvmOSGuZR6-awirryqGAaUG2Ln-nXKPDSKc1XKicSZi5GLfaoxSV0E35gatUVY7_dEsIV_g3lC_ArHB0I_5OFKdUf9NTSypg631NrQEfE5b11-kSp5i8DBSFspgm42gw1e1x0ULFz9GHmOxQetU7syFqdzbmcbNBidWNj1N42bKQDZpTG6378t1zECWU5gHN943-pio9-G9m2Vz4Nk6Ly97Vn1CD5Caoj2ASHnaBHez9osNKVSF7X_91UNlu9sBsrRV3mIVYrAHrbp9d0XgqvTvYoNXzdmkMoTitLnRLst66zU6lMhcV1TGxec3RhAjomvf0plQFUimH3hXeXODd8n81ATFVloSUSnZbL7mUPshriRW6PfWHMr1Uoq14RI5Mdbc3XCl-Fd49uHoPQXMBTbUOQXMTq5Voexg0fuh1uWMspVVJ-IAPHhLtdCamGVbxAoIfciNXx8hPl8rvpr3zRJujQ8l3s"}',
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          Authorization: `Bearer ${vars['token']}`,
          'Sec-Fetch-Site': 'cross-site',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Sec-Fetch-Mode': 'cors',
          Host: 'pizza-factory.cs329.click',
          Origin: 'https://pizza.pizzaboston.click',
          Connection: 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
        },
      }
    )
  })
}