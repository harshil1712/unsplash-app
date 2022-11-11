import { setup } from '@contentful/dam-app-base';
import { AssetCard, Form, TextInput, FormControl, Button, Stack, Spinner } from '@contentful/f36-components';
import { useEffect, useState } from 'react';
import { render } from 'react-dom';
import './index.css';
import { pick } from './utils';

const CTA = 'Unsplash DAM App';
const FIELDS_TO_PERSIST = ['id', 'name', 'url'];

setup({
  cta: CTA,
  name: 'Unsplash App',
  logo: 'https://unsplash.com/assets/core/logo-black-df2168ed0c378fa5506b1816e75eb379d06cfcd0af01e07a2eb813ae9b5d7405.svg',
  color: '#036FE3',
  description:
    'An app to use images from Unsplash',
  parameterDefinitions: [
    {
      id: 'apiKey',
      type: 'Symbol',
      name: 'API Key',
      description: 'Provide the API key here',
      required: true,
    },
  ],
  validateParameters,
  makeThumbnail,
  renderDialog,
  openDialog,
  isDisabled: () => false,
});

function DialogLocation({ sdk }) {
  const apiKey = sdk.parameters.installation.apiKey;

  const [damData, setDAMData] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(()=>{
    setIsLoading(!isLoading)
  }, [damData])
  
  const handleRandom = async () => {
    setIsLoading(true);
    const response = await fetch(`https://api.unsplash.com/photos/random?client_id=${apiKey}`);
    const result = await response.json();
    setDAMData(result);
    return result;
  }

  const handleSearch = async () => {
    setIsLoading(true);
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${searchValue}&client_id=${apiKey}`);
    const result = await response.json();
    setDAMData(result.results);
    console.log(result)
    return result;
  }
  
  const renderData = () => {
    if(isLoading){
      return <Spinner />
    } else {
      if(!damData) {
        return null;
      }
      else if(!damData.length) {
        return <AssetCard 
          type='image'
          title={damData.description}
          src={damData.urls.raw}
          size="default"
          onClick={() => handleOnClick({
            id: damData.id,
            title: damData.description,
            url: damData.urls.raw
          })}
        />
      }
      return <Stack flexDirection="column">
        {damData.map((item) => (
          <AssetCard
            key={item.id}
            title={item.description}
            description={item.alt_desription || item.description}
            src={item.urls.raw}
            type="image"
            onClick={() => handleOnClick({
              id: item.id,
              title: item.description,
              url: item.urls.raw
            })}
          />
        ))}
      </Stack>
    }
  }

  const handleOnClick = (attachment) => {
    sdk.close([attachment])
  }

  return (
    <>
    <Form>
      <Stack>
      <FormControl>
      <FormControl.Label>Search</FormControl.Label>
      <TextInput 
        value={searchValue}
        onChange={(e)=> setSearchValue(e.target.value)}
      />
      </FormControl>
      <Button variant="primary" onClick={handleSearch}>Search</Button>
      <Button variant="secondary" onClick={handleRandom}>Random</Button>
      </Stack>
    </Form>
    {
      renderData()
    }
    </>
  );
}

function makeThumbnail(attachment) {
  const thumbnail = attachment.url;
  const url = typeof thumbnail === 'string' ? thumbnail : undefined;
  const alt = attachment.name;
  return [url, alt];
}

async function renderDialog(sdk) {
  render(<DialogLocation sdk={sdk} />, document.getElementById('root'));
  sdk.window.startAutoResizer();
}

async function openDialog(sdk, _currentValue, _config) {
  const result = await sdk.dialogs.openCurrentApp({
    position: 'center',
    title: CTA,
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    width: 1000,
    allowHeightOverflow: true,
  });

  if (!Array.isArray(result)) {
    return [];
  }
  return result.map((asset) => pick(asset, FIELDS_TO_PERSIST));
}

function validateParameters({ apiKey }) {
  if (!apiKey) {
    return 'Please add an API Key';
  }

  return null;
}
