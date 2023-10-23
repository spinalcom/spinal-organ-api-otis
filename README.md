# spinal-organ-api-otis
Simple BOS-Otis api connector to register tickets containing various elevator data

## Getting Started

These instructions will guide you on how to install and make use of the spinal-organ-api-otis.

### Prerequisites

This module requires a `.env` file in the root directory with the following variables:

```bash
SPINAL_USER_ID=                             # The id of the user connecting to the spinalhub
SPINAL_PASSWORD=                            # The password of the user connecting to the spinalhub
SPINALHUB_IP=                               # The IP address of the spinalhub
SPINALHUB_PROTOCOL=                         # The protocol for connecting to the spinalhub (http or https)
SPINALHUB_PORT=                             # The port for connecting to the spinalhub
DIGITALTWIN_PATH=                           # The path of the digital twin in the spinalhub
SPINAL_ORGAN_NAME=                          # The name of the organ
SPINAL_CONFIG_PATH=                         # The path of the config file in the spinalhub exemple : /etc/Organs/otis

TMP_TICKET_TARGET_ID=                       # The static id of the target node for the tickets
TICKET_CONTEXT_ID=                          # The static id of the context node for the tickets
SPATIAL_CONTEXT_ID=                         # The static id of the spatial context node for the tickets
AVAILABILITY_PROCESS_NAME=                  # The name of the availability process
MAINTENANCE_PROCESS_NAME=                   # The name of the maintenance process
REPAIR_PROCESS_NAME=                        # The name of the repair process
CUSTOMER_CALLBACK_PROCESS_NAME=             # The name of the customer callback process

PULL_INTERVAL=                              # Time (in ms) between each update of tickets
OTIS_AVAILABILITY_SUBSCRIPTION_KEY=         # The subscription key for the otis availability api
OTIS_MAINTENANCE_SUBSCRIPTION_KEY=          # The subscription key for the otis maintenance api
OTIS_REPAIR_SUBSCRIPTION_KEY=               # The subscription key for the otis repair api
OTIS_CUSTOMER_CALLBACK_SUBSCRIPTION_KEY=    # The subscription key for the otis customer callback api
CUSTOMER_ID=                                # The customer id for the otis api
CONTRACT_NUMBER=                            # The contract number for the otis api
COUNTRY_CODE=                               # The country code for the otis api

```


### Installation

Clone this repository in the directory of your choice. Navigate to the cloned directory and install the dependencies using the following command:
    
```bash
npm install
```

To build the module, run:

```bash
npm run build
```

### Usage

Start the module with:

```bash
npm run start
```

Or using [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/)
```bash
pm2 start index.js --name organ-otis
```
```