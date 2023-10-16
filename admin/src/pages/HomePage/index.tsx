import { Dialog, DialogBody, Icon, IconButton, DialogFooter, Flex, Box, Button, Checkbox, ContentLayout, HeaderLayout, Layout, Main, SingleSelect, SingleSelectOption, Table, Tbody, Td, TextInput, Th, Thead, Tr, Typography } from "@strapi/design-system";
import { Pencil, Trash } from '@strapi/icons';
import { request } from '@strapi/helper-plugin';
import { isEqual } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import pluginId from '../../pluginId';

function isValidUrl(str) {
  // missing placeholder
  if (!str.includes('[field]')) {
    return false;
  }

  str = str.replaceAll('[field]', 'foo');
  str = str.replaceAll('[locale]', 'bar');

  const absoluteRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
  const relativeRegex = /^\/[-a-zA-Z0-9()@:%_\+.~#?&//=]/gi

  return absoluteRegex.test(str) || relativeRegex.test(str);
}

const Row = ({ item, onItemsCreated }) => {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState({ ...item });
  const [updated, setUpdated] = useState({ ...item });
  const isChanged = useMemo(() => !isEqual(current, updated), [current, updated]);
  const valid = isValidUrl(updated.url);

  const handleToggleEnabled = () => {
    setUpdated({
      ...updated,
      enabled: !updated.enabled,
    });
  }

  const handleChangeField = (fieldName: string) => {
    setUpdated({
      ...updated,
      field: fieldName,
    });
  }

  const handleChangeURL = (url: string) => {
    setUpdated({
      ...updated,
      url: url,
    });
  }

  const handleSave = async () => {
    // const prompt = updated.enabled && ((current.url && current.url !== updated.url) || (current.field && current.field !== updated.field));
    // if (prompt) {
    //   setIsVisible(true);
    //   return
    // } 

    await doSave();
  }

  const doSave = async (generate?: boolean) => {
    try {
      setLoading(true);

      const { created } = await request(`/${pluginId}/rules`, {
        method: 'POST',
        body: {
          generate,
          updated
        }
      })

      setCurrent({...updated });
      onItemsCreated(created);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  const [isVisible, setIsVisible] = useState(false);
  
  const msg = `Enter a valid url (absolute or relative), and include the [field] placeholder`;

  return (
    <>
      <Tr>
        <Td style={{ width: '20%',}}>
          <Typography>{current.info.displayName}</Typography>
        </Td>
        <Td style={{ width: 225 }}>
          <SingleSelect onChange={handleChangeField} value={updated.field} placeholder="Choose field">
            {current.fields.map(field => (
              <SingleSelectOption value={field.name}>{field.name}</SingleSelectOption>
            ))}
          </SingleSelect>
        </Td>
        <Td>
          <TextInput aria-label="URL" placeholder="/path/[value]" value={updated.url} onInput={(evt) => handleChangeURL(evt.target.value)} error={valid ? undefined : msg}  />
        </Td>
        <Td style={{ width: 100 }}>
          <Checkbox onValueChange={handleToggleEnabled} value={updated.enabled}/>
        </Td>
        <Td style={{ width: 100 }}>
          <Button size="L" disabled={!isChanged || !valid} onClick={handleSave} loading={loading}>Save</Button>
        </Td>
      </Tr>

      <Dialog onClose={() => setIsVisible(false)} title="Redirects" isOpen={isVisible}>
        <DialogBody>
          <Flex direction="column" alignItems="center" gap={2}>
            <Flex justifyContent="center">
              <Typography id="confirm-description">You changed the URL structure, would you like to create redirects from all existing urls to the new?</Typography>
            </Flex>
          </Flex>
        </DialogBody>
        <DialogFooter
          startAction={<Button onClick={() => { doSave(true); setIsVisible(false)}} variant="default">Yes</Button>}
          endAction={<Button onClick={() => { doSave(false); setIsVisible(false)}}variant="danger-light">No thanks</Button>}
          />
      </Dialog>
    </>
  )
}

const HomePage = () => {
  const [rules, setRules] = useState<any>([]);
  const [createdItems, setCreatedItems] = useState<any[]>([]);
  
  async function fetchRules() {
    const data = await request(`/${pluginId}/rules`);

    setRules(data.items.map(item => ({
      ...item,
      enabled: item.enabled || false,
      field: item.field || item.fields[0].name,
      url: item.url || `/${item.info.pluralName}/[field]`,
    })));
  }

  useEffect(() => {
    fetchRules();
  }, []);
  

  const handleDelete = async (idx) => {
    await request(`/${pluginId}/delete-redirect`, {
      method: 'POST',
      body: {
        id: createdItems[idx].id,
      }
    });

    const updated = [...createdItems];
    updated.splice(idx, 1);

    setCreatedItems(updated);
  }
  
  return (
    <Layout>
      <Main>
        <HeaderLayout title="Auto redirect" />

        <ContentLayout>
          <Box>
            <Box paddingBottom={10}>
              <Typography textColor="neutral600" variant="epsilon">
                Auto redirect will monitor changes to your content types
                 and automatically create redirects for you.
                 For each content-type choose what field to monitor,
                 and use the speciel placeholder <Typography variant="sigma">[field]</Typography> to define the url path. <br /><br />

                 ex:
                 /blog/<Typography>[field]</Typography>

                 <br/><br/>
                 You can also use the <Typography variant="sigma">[locale]</Typography> placeholder if you use the I18N plugin.
                 <br /><br />

                 ex:
                 /<Typography>[locale]</Typography>/products/<Typography>[field]</Typography>
              </Typography>
            </Box>

            {createdItems?.length ? (
              <div style={{ marginBottom: 25 }}>
                <div style={{ marginBottom: 10 }}>
                  <Typography variant="beta">Redirects created</Typography>
                </div>
                <Table>
                  <Thead>
                    <Tr>
                      <Th><Typography variant="sigma">Fom</Typography></Th>
                      <Th><Typography variant="sigma">To</Typography></Th>
                      <Th><Typography variant="sigma"></Typography></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {createdItems.map((item, idx) => {
                      return (
                        <Tr key={idx}>
                          <Td><Typography variant="pi">{item.from}</Typography></Td>
                          <Td><Typography variant="pi">{item.to}</Typography></Td>
                          <Td>
                            <Flex>
                              <IconButton style={{ marginRight: 10 }} onClick={() => window.open(`/admin/content-manager/collectionType/plugin::auto-redirect.redirect/${item.id}`, 'editor')} label="Edit" icon={<Pencil />} tabIndex={-1} />
                              <IconButton onClick={() => handleDelete(idx)} label="Remove" icon={<Trash />} tabIndex={-1} />
                            </Flex>
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </div>
            ) : null}

            <Table>
              <Thead>
                <Tr>
                  <Th><Typography variant="sigma">Content type</Typography></Th>
                  <Th><Typography variant="sigma">Field</Typography></Th>
                  <Th><Typography variant="sigma">URL</Typography></Th>
                  <Th><Typography variant="sigma">Enabled</Typography></Th>
                  <Th></Th>
                </Tr>
              </Thead>

              <Tbody>
                {rules.map((item) => <Row item={item} onItemsCreated={(items) => setCreatedItems(items)} />)}
              </Tbody>
            </Table>
          </Box>
        </ContentLayout>
      </Main>

    </Layout>
  );
};

export default HomePage;
