import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  //Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  image: string;
  description: JSX.Element;
  position: boolean;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Test-Driven Software Experimentation with LSL',
    //Svg: require('@site/static/img/undraw_services_re_hu5n.svg').default,
    image: 'img/features/services.png',
    description: (
      <>
        Utilize <a href="hub">LSL (LASSO Scripting Language)</a> for customizable code analysis services, including Code Search and Generation (via LLMs), Test Generation, and Study Designs, enabling reproducible research in software engineering.
      </>
    ),
    position: true,
  },
  {
    title: 'Data Structures - Storing Observations for Big Code',
    //Svg: require('@site/static/img/undraw_services_re_hu5n.svg').default,
    image: 'img/features/datastructures.png',
    description: (
      <>
        LASSO's core building blocks include: Use <a href="pdfviewer?f=L9-Sequence-Sheets-24.pdf">Sequence Sheets (SSNs)</a> as test specifications, <a href="pdfviewer?f=L10-Test-Driven-Software-Experimentation-24.pdf">Stimulus Response Matrices (SRMs)</a> for configurations of tests and implementations, and Stimulus Response Hypercubes (SRHs) for software analytics of behavior.
      </>
    ),
    position: false,
  },
  {
    title: 'Behavior-aware Software Analytics',
    //Svg: require('@site/static/img/undraw_services_re_hu5n.svg').default,
    image: 'img/features/analytics.png',
    description: (
      <>
        Conduct extensive, behavior-aware <a href="docs/analytics/data">software analytics</a> based on observations stored in SRHs in your favorite data analytics tools. This includes establishing functional correctness across code candidates as well as behavioral clustering based on observed behavior (i.e., outputs).
      </>
    ),
    position: true,
  },
  {
    title: 'Open, Extensible Platform that Fosters Sharability',
    //Svg: require('@site/static/img/undraw_services_re_hu5n.svg').default,
    image: 'img/features/services_dag.png',
    description: (
      <>
        The platform is extensible. Extend it with your own tools and techniques via well-defined APIs and state-of-the-art tools (i.e., containerization). The platform and its data complies with <a href="https://www.sciencedirect.com/science/article/pii/S0164121224000141">open research principles</a> and fosters sharability of pipelines and results.
      </>
    ),
    position: false,
  },
];

function Feature({title, image, description, position}: FeatureItem) {
  let img = (        
    <div className={clsx('col col--6')}>
      <div className="text--center">
        {/* <Svg className={styles.featureSvg} role="img" /> */}
        <img src={image} className={styles.featureImg}></img>
      </div>
    </div>
  );
  let content = (
    <div className={clsx('col col--6')}>
      <div className="text--center">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );

  if(position) {
    return (
      <div className="row">
        {img}
        {content}
      </div>
    );
  } else {
    return (
      <div className="row">
        {content}
        {img}
      </div>
    );
  }
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
          {FeatureList.map((props, idx) => (
            <div className="row margin--lg padding--lg shadow--md">
              <Feature key={idx} {...props} />
            </div>
          ))}
      </div>
    </section>
  );
}
