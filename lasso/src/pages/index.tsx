import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';
import CardHeader from '../components/SimpleCard/CardHeader';
import Card from '../components/SimpleCard/Card';
import CardBody from '../components/SimpleCard/CardBody';
import CardFooter from '../components/SimpleCard/CardFooter';
import CardImage from '../components/SimpleCard/CardImage';

import CodeBlock from '@theme/CodeBlock';

import CookieConsent from "react-cookie-consent";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const recentPosts = require("../../.docusaurus/docusaurus-plugin-content-blog/default/blog-post-list-prop-default.json");

  return (
    <header className={clsx('hero', styles.heroBanner)}>

      <div className="container">
        <div className="row">
          <div className="col col--4">
            <div className="container">
              <img src="img/lasso_logo_trans.png" className={clsx(styles.logo)}></img>

            </div>
          </div>
          <div className="col col--4">
            <Heading as="h1" className="hero__title">
              {siteConfig.title}
            </Heading>
            <p className="hero__subtitle">{siteConfig.tagline}</p>
            <div className={styles.buttons}>
              <div className="button-group button-group--block">
                <Link
                  className="button button--secondary button--lg"
                  to="/hub">
                  Explore Pipelines 🧪
                </Link>
                <Link
                  className="button button--secondary button--lg"
                  to="/docs/quickstart/scenario">
                  5 Minute Tutorial 📖
                </Link>
                <Link
                  className="button button--secondary button--lg"
                  to="/about">
                  What is LASSO ❔
                </Link>
              </div>
            </div>
          </div>
          <div className="col col--4">
            <div className="container padding--sm">
              <Card shadow='tl' >
                <CardHeader style={{ backgroundColor: '#ffffff', color: 'black' }} className='text--center'>
                  <h3>Recent Blog Posts</h3>
                </CardHeader>

                <CardBody style={{ backgroundColor: '#ffffff', color: 'black' }} className='text--center'>
                  <div className="container">
                    <div className="row">
                      <ul>
                        {recentPosts.items.slice(0, 3).map((item, index) => (
                          <li key={index}>
                            <a href={`${item.permalink}`}>{item.title}</a>{" "}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardBody>


                <CardFooter style={{ backgroundColor: '#ffffff', color: 'black' }} className='text--center'>
                  <Link
                    className="button button--secondary"
                    to="/blog">
                    All Posts
                  </Link>
                </CardFooter>

              </Card>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// You can customize this value
const featuredSearchUrl = 'lasso/result?executionId=69184769-d4c2-43d0-a101-987e5c30d674';
const featuredSearchTitle = 'LSL Study Pipelines in Action';
const featuredSearchDesc = 'Explore LSL pipeline results';

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={`${siteConfig.title}`}
      description="LASSO Project">
      <HomepageHeader />
      <main>
        <section className={clsx(styles.screenshotcontents)}>
          <div className="container padding--sm">
            <div className="row">
              <div className="col col--4 padding--sm text--center">
                {/* <Card shadow='tl' >
                <CardImage cardImageUrl="img/screens/quickstart_results.png" className="" alt={''} title={''} />
              </Card> */}
                <a target="_blank" href="img/screens/quickstart_results.png"><img className={clsx(styles.screenshot)} src="img/screens/quickstart_results.png"></img></a>
              </div>
              <div className="col col--4 padding--sm text--center">
                {/* <Card shadow='tl' >
                <CardImage cardImageUrl="img/screens/quickstart_results_filters.png" className="" alt={''} title={''} />
              </Card> */}
                <a target="_blank" href="img/screens/quickstart_results_filters.png"><img className={clsx(styles.screenshot)} src="img/screens/quickstart_results_filters.png"></img></a>
              </div>
              <div className="col col--4 padding--sm text--center">
                {/* <Card shadow='tl' >
                <CardImage cardImageUrl="img/screens/quickstart_jupyterlab.png" className="" alt={''} title={''} />
              </Card> */}
                <a target="_blank" href="img/screens/quickstart_jupyterlab.png"><img className={clsx(styles.screenshot)} src="img/screens/quickstart_jupyterlab.png"></img></a>
              </div>


            </div>
          </div>

        </section>

        <section>
          <div className="container padding--sm">
            <div className="text--center">
              <Heading as="h2">Try LASSO in 5 Minutes</Heading>
            </div>
            <div className="row margin--lg padding--lg shadow--md">
              <div className={clsx('col col--10 col--offset-1')}>
                <p>
                  To get started, run the following two commands in a local directory on your machine (requires{' '}
                  <a href="https://docs.docker.com/compose/">docker compose</a>):
                </p>
                <div className="codeBlockWrapper">
                  <CodeBlock language="bash">
                    {`curl https://raw.githubusercontent.com/SoftwareObservatorium/lasso/refs/heads/develop/docker/compose/docker-compose-embedded.yml -o docker-compose.yml
docker compose up`}
                  </CodeBlock>
                </div>
                <p>
                  Wait until all services started (LASSO platform, Code Search Index and Artifact Repository) and then open LASSO's dashboard at{' '}
                  <a href="http://localhost:10222/webui/">http://localhost:10222/webui/</a> (login: admin / admin123).
                  See <a href="./docs/quickstart/scenario">5 Minute Tutorial</a> for details, and{' '}
                  <a href="./labs">Labs (Playground)</a> for more options.
                </p>

                {/* --- "Eye-catcher" Card Section --- */}
                <div className="featured-search-card margin-top--lg margin-bottom--lg">
                  <div className="featured-search-card-header">

                    Example Run
                  </div>
                  <div className="featured-search-card-body">
                    <div className="featured-search-title">{featuredSearchTitle}</div>
                    <div className="featured-search-desc">{featuredSearchDesc}</div>
                    <a
                      className="button button--primary"
                      href={featuredSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginTop: "1em" }}>
                      View Pipeline Results
                    </a>
                  </div>
                </div>
                <style>{`
              .featured-search-card {
                border: 2px solid #0075FF;
                border-radius: 0.7em;
                background: #F1F7FF;
                text-align: center;
                padding: 2em 1em;
                box-shadow: 0 2px 16px 0 #0075ff33;
                margin: 2em 0;
                max-width: 480px;
                margin-left: auto;
                margin-right: auto;
                transition: box-shadow 0.18s;
              }
              .featured-search-card:hover {
                box-shadow: 0 4px 32px 0 #0075ff66;
              }
              .featured-search-card-header {
                color: #0075FF;
                font-weight: bold;
                font-size: 1.2em;
                margin-bottom: 0.7em;
                letter-spacing: 0.02em;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.3em;
              }
              .featured-search-title {
                font-size: 1.1em;
                font-weight: 600;
                margin-bottom: 0.2em;
              }
              .featured-search-desc {
                color: #444;
                font-size: 0.97em;
                margin-bottom: 0.9em;
              }
            `}</style>
                {/* --- End eye-catcher --- */}

              </div>
            </div>
          </div>
        </section>

        <HomepageFeatures />
        <CookieConsent>This website uses cookies to enhance the user experience.</CookieConsent>
      </main>
    </Layout>
  );
}
