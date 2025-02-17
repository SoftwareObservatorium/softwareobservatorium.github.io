import React from 'react';
// Importing the original mapper + our components according to the Docusaurus doc
import MDXComponents from '@theme-original/MDXComponents';
import Card from '@site/src/components/SimpleCard/Card';
import CardBody from '@site/src/components/SimpleCard/CardBody';
import CardFooter from '@site/src/components/SimpleCard/CardFooter';
import CardHeader from '@site/src/components/SimpleCard/CardHeader';
import CardImage from '@site/src/components/SimpleCard/CardImage';


export default {
  // Reusing the default mapping
  ...MDXComponents,
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter,
  CardImage, 
};