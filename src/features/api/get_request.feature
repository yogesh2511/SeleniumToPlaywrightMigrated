@api
Feature: API Request Validation
  As an API consumer
  I want to validate API responses
  So that I can ensure data integrity

  Scenario: Validate Get request response
    When I send a GET request to "/sample-request?author=beeceptor"
    Then the response should have valid path
    Then the response should have valid ip
    Then the response should contain headers:
      | Header Name     | Expected Value                          |
      | Host            | echo.free.beeceptor.com                 |
      | User-Agent      | axios/1.15.0                            |
      | Accept          | application/json, text/plain, */*       |
      | Accept-Encoding | gzip, compress, deflate, br             |
