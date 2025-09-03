# Private vs Public IP


IPv4, or Internet Protocol version 4, is the fourth version of the Internet Protocol (IP) and it routes most of the traffic on the Internet. An easy way to understand IPv4 is to compare it to a postal system for computers. Just as each home has a unique postal address, each device connected to the internet is assigned a unique IP address. This address is used to identify and locate these devices, allowing them to communicate with each other.

### IPv4 Address Notation
IPv4 addresses are written as four sets of numbers separated by periods; for example, `192.168.1.1`. Each set represents a byte of the IP address and can range from 0 to 255. This notation is known as "dotted decimal" notation.

### Private vs Public IP Addresses
- **Public IP Addresses:**
  - These are globally unique IP addresses assigned by the Internet Assigned Numbers Authority (IANA) and are used on the internet.
  - Public IPs must be unique across the entire internet.
  - Example uses include hosting websites, emails, and other services that need to be accessed from the internet.

- **Private IP Addresses:**
  - These are not allocated by IANA and are used within private networks. They are not routable on the internet, which means they cannot be reached directly from outside the network.
  - Private IPs are often used for devices within home networks, corporate environments, etc.
  - Common private IP ranges include `192.168.x.x`, `10.x.x.x`, and `172.16.x.x` to `172.31.x.x`.

Understanding the distinction between public and private IPs is crucial for network configuration and security. Private IP addresses allow for secure communications within a network, while public IPs enable communication with devices across the internet.

