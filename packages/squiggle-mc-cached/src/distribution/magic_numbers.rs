pub mod bandwidth {
    //  Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.
    //  Scott, D. W. (1992) Multivariate Density Estimation: Theory, Practice, and Visualization. Wiley.
    pub struct Parameters {
        pub iqr_percentile: f64,
        pub iqr_percentile_complement: f64,
        pub nrd0_lo_denominator: f64,
        pub nrd0_coef: f64,
        pub nrd_coef: f64,
        pub nrd_fractional_power: f64,
    }

    impl Default for Parameters {
        fn default() -> Parameters {
            let iqr_percentile: f64 = 0.75;
            let iqr_percentile_complement: f64 = (1.0 as f64) - iqr_percentile;
            Parameters {
                iqr_percentile: iqr_percentile,
                iqr_percentile_complement: iqr_percentile_complement,
                nrd0_lo_denominator: 1.34,
                nrd0_coef: 0.9,
                nrd_coef: 1.06,
                nrd_fractional_power: -0.2,
            }
        }
    }
}

pub mod to_point_set {
    use std::cmp::max;
    /** This function chooses the minimum amount of duplicate samples that need
     to exist in order for this to be considered discrete. The tricky thing
     is that there are some operations that create duplicate continuous samples,
     so we can't guarantee that these only will occur because the fundamental
     structure is meant to be discrete. I chose this heuristic because I think
     it would strike a reasonable trade-off, but I’m really unsure what’s
     best right now.
    */
    pub fn min_discrete_to_keep(samples: [f64; 3]) -> usize {
        return max(20, samples.len() / 50);
    }
}

pub mod environment {
    pub struct Parameters {
        pub default_xy_point_length: usize,
        pub default_sample_count: usize,
        pub sparkline_length: usize,
    }
    impl Default for Parameters {
        fn default() -> Parameters {
            Parameters {
                default_xy_point_length: 1000,
                default_sample_count: 10000,
                sparkline_length: 20,
            }
        }
    }
}
