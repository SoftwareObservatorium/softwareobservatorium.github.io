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

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
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
              to="/playground">
              Documentation 📖
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
          <div className="container padding--lg">
      <Card shadow='tl' >
        <CardHeader style={{ backgroundColor: '#ffffff' , color:'black'}} className='text--center'>
          <h3>Recent Blog Posts</h3>
        </CardHeader>

        <CardBody style={{ backgroundColor: '#ffffff' , color:'black'}} className='text--center'> 
        <div className="container">
                <div className="row">
                  <ul>
                        {recentPosts.items.slice(0, 5).map((item, index) => (
                          <li key={index}>
                            <a href={`${item.permalink}`}>{item.title}</a>{" "}
                          </li>
                        ))}
                  </ul>
                </div>
              </div>
        </CardBody> 


        <CardFooter style={{ backgroundColor: '#ffffff' , color:'black'}} className='text--center'> 
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

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();

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
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
