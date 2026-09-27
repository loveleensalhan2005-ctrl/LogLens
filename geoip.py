import geoip2.database


DATABASE_PATH = "GeoLite2-Country.mmdb"


def get_country(ip_address):
    try:
        with geoip2.database.Reader(DATABASE_PATH) as reader:
            response = reader.country(ip_address)

            return {
                "country": response.country.name,
                "country_code": response.country.iso_code
            }

    except Exception:
        return {
            "country": "Private/Unknown",
            "country_code": None
        }


if __name__ == "__main__":

    test_ip = "8.8.8.8"

    result = get_country(test_ip)

    print("GeoIP Result:")
    print(result)