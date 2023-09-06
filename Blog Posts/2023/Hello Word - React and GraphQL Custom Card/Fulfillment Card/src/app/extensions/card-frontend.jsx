//This custom card is intended to be used with the "Companies" objectType within the CRM as defined in the fulfillment-card.json file.

// Beging by importing React and HubSpot defined react components.
import React, { useEffect, useState } from "react";
import { Button, Text, Flex, Tag, hubspot, LoadingSpinner, TableBody, TableCell, TableHead, TableRow, TableHeader, Table, Heading, Link } from "@hubspot/ui-extensions";

// This code defines an extension for the HubSpot platform. The hubspot.extend() function takes an object that contains three parameters: "context", "runServerlessFunction", and "actions". It then returns an Extension React component that has the values for those 3 parameters.
hubspot.extend(({ context, runServerlessFunction, actions }) => 
  <Extension 
    context={context} 
    runServerless={runServerlessFunction} 
    fetchProperties={actions.fetchCrmObjectProperties} 
  />
);

// The Extension Component.
const Extension = ({ context, runServerless, fetchProperties }) => {
  // creating our constants to hold data. useState allows you to track the state of the const within a functioning component.

  //This will hold our "Shipments" data from our GraphQL query in fetchAssociatedOrders.js.
  const [shipments, setShipments] = useState(null); 

  //Boolean - sets visibility of showing details screen.
  const [showShipmentDetails, setShowShipmentDetails] = useState(false); 

  // Holds our "Order Number" for our "Shipment" that is then shown when viewing the details of the shipment.
  const [shipmentDetailsOrderNumber, setShipmentDetailsOrderNumber] = useState(null); 

  // Holds the "hs_object_id" of the shipment that is used to filter the right shipment when viewing details of the shipment.
  const [shipmentHSObjectId, setShipmentHSObjectId] = useState(null); 

  // Holds the "hs_object_id" of the current company being viewed. This is then used as parameter in our GraphQL query to get the correct companies associations.
  const [currentObjectID, setCurrentObjectID] = useState(null); 

  //Boolean - defines loading state of the content.
  const [loading, setLoading] = useState(true); 

  // useEffect allows you to perfrom side effects in your components. 
  useEffect(() => {
    // fetch the hs_object_id property of the company.
    fetchProperties(["hs_object_id"]).then((properties) => {
      // set the currentObjectID const == to the hs_object_id.
      setCurrentObjectID(properties.hs_object_id);
    });
    // Run our serverless function "fetchAssociatedOrders" - name and location of code to run are defined in our serverless.json file.
    runServerless({ name: "fetchAssociatedShipments", parameters: { hs_object_id: currentObjectID } }).then((resp) => {
      
      // Log the response to the console. This will help us find the path to the items that we will define in our "shipments" const. Once you have the "shipments" const ready, you can comment this out or remove it.
      //console.log(resp); 

      // if our serverless call is made successfully...
      if (resp.status === "SUCCESS") {
        // set our "shipments" const to the "items" array from our serverless function.
        setShipments(resp.response.data.CRM.company.associations.p_shipments_collection__shipments_to_company.items);
        // Set the loading state to false. This will remove our <LoadingSpinner> component once our data has been loaded and is available.
        setLoading(false);
      }
    });
    // When currentObjectID changes the effect will run again.
  }, [currentObjectID]);

  /*
  *   Functions
  */

  // When the "View Details" button is clicked in the "Shipments" table. 
  const openShipmentDetails = (hs_object_id, order_num) => {
    // Set the id of the current "Shipment" for use in filtering of the details as the value passed in from the button.
    setShipmentHSObjectId(hs_object_id);
    // Set the order number of the shipment for display on the details screen as the value passed in from the button.
    setShipmentDetailsOrderNumber(order_num);
    // Set visibility of the details screen to true.
    setShowShipmentDetails(true);
  };

  // Sets the <Tag> component variants.
  const renderTag = (status) => {
    if (status == "complete" || status == "delivered") {
      return "success";
    } else if (status == "on_hold") {
      return "warning";
    } else {
      return "default";
    }
  };

  // Filters the "Shipment" details and renders the associated kit data for the "Shipment".
  const renderShipmentDetails = () => {
    // Filter the Shipments available based on the shipment's hs_object_id passed in from the button and assign the filtered shipment to a const.
    // Sample for filter from: https://upmostly.com/tutorials/react-filter-filtering-arrays-in-react-with-examples
    const filteredShipmentDetails = shipments.filter((filteredShipment) => filteredShipment.hs_object_id == shipmentHSObjectId);
    // Map the filtered shipment details array, then map the nested associated kits array.
    return filteredShipmentDetails.map((filteredItem) =>
      filteredItem.associations.p_kits_collection__shipments_to_kits.items.map((kit) => (
        <TableRow>
          <TableCell>{kit.year}</TableCell>
          <TableCell>{kit.kit_number}</TableCell>
          <TableCell>
            <Tag variant={renderTag(kit.status.value)}>{kit.status.label}</Tag>
          </TableCell>
          <TableCell>{kit.hold_reason}</TableCell>
        </TableRow>
      ))
    );
  };

  /*
  *   Screens
  */

  // If our showShipmentDetails boolean is true, show the details of the shipment.
  if (showShipmentDetails) {
    return (
      <>
        <Flex direction={'column'} wrap={'wrap'} gap={'small'}>
          <Heading>{shipmentDetailsOrderNumber} Order Details</Heading>
          <Table bordered={true}>
            <TableHead>
              <TableRow>
                <TableHeader>Year</TableHeader>
                <TableHeader>Kit Number</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Notes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderShipmentDetails()} 
            </TableBody>
          </Table>
          {/* Create a button and set the visibility of the details screen to false when clicked. */}
          <Button onClick={() => { setShowShipmentDetails(false);}}>
            Back
          </Button>
          </Flex>
      </>
    );
  }

  return (
    <>
      {/* If our const that signifies the loading state is true, show a loading indicator. This helps prevent the user from seeing a partially loaded component while the data loads. */}
      {loading && <LoadingSpinner label='Data is loading' showLabel={true} size='md' layout='centered'></LoadingSpinner>}
      {/* Show the table if the "shipments" const contains data. */}
      {shipments && (
        <>
        <Flex direction={'column'} wrap={'wrap'} gap={'small'}>
          <Heading>Shipments</Heading>
          <Table bordered={true} width='auto'>
            <TableHead>
              <TableRow>
                <TableHeader>Year</TableHeader>
                <TableHeader>Order Number & Info</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Carrier/Tracking</TableHeader>
                <TableHeader></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Map the "shipments" array data. */}
              {shipments.map((shipment) => (
                <TableRow>
                  <TableCell>{shipment.year}</TableCell>
                  <TableCell>
                    <Flex direction={'column'} wrap={'wrap'} gap={'small'}>
                      <Text>#{shipment.order_num}</Text>
                      <Text>{shipment.description}</Text>
                    </Flex>
                  </TableCell>
                  <TableCell>
                    <Tag variant={renderTag(shipment.status.value)}>{shipment.status.label}</Tag>
                  </TableCell>
                  {/* For Demo purposes we are simply passing the tracking number to afterships free service. */}
                  <TableCell>
                    <Flex direction={'column'} wrap={'wrap'} gap={'small'}>
                      <Text>{shipment.carrier ? shipment.carrier.label : ""}</Text>
                      <Text>{shipment.tracking_num ? <Link href={"https://www.aftership.com/track/" + shipment.carrier.value + "/" + shipment.tracking_num}>{shipment.tracking_num}</Link> : ""}</Text>
                    </Flex>
                  </TableCell>
                  <TableCell>
                    <Link onClick={() => openShipmentDetails(shipment.hs_object_id, shipment.order_num)} variant='primary'>
                      View Details
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Flex>
        </>
      )}
    </>
  );
};
