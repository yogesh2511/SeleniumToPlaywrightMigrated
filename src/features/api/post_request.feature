@api
Feature: Order API Validation
  As an API consumer
  I want to validate order API responses
  So that I can ensure data integrity

  Scenario: Validate POST request with Order payload
    Given I have the order payload from file "premium_order.json"
    When I send a "POST" request to "/sample-request" with:
      | author | beeceptor |
    Then the response status code should be 200
    Then the response should contain customer information:
      | Field Path               | Expected Value        |
      | customer.name            | Jane Smith            |
      | customer.email           | janesmith@example.com |
      | customer.phone           | 1-987-654-3210        |
      | customer.address.street  | 456 Oak Street        |
      | customer.address.city    | Metropolis            |
      | customer.address.state   | NY                    |
      | customer.address.zipcode | 10001                 |
      | customer.address.country | USA                   |
    And the response should contain payment detail:
      | Field Path             | Expected Value |
      | payment.method         | credit_card    |
      | payment.transaction_id | txn_67890      |
      | payment.amount         | 111.97         |
      | payment.currency       | USD            |
    And the response should contain first details:
      | Field Path          | Expected Value      |
      | items[0].product_id | A101                |
      | items[0].name       | Wireless Headphones |
      | items[0].quantity   | 1                   |
      | items[0].price      | 79.99               |
    And the response should contain second details:
      | Field Path          | Expected Value  |
      | items[1].product_id | B202            |
      | items[1].name       | Smartphone Case |
      | items[1].quantity   | 2               |
      | items[1].price      | 15.99           |
